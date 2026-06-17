"""
Telegram Bot for my-todo
Interacts with my-todo API (localhost:8000) to manage todos and notes.
"""

import os
import logging
import httpx
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# --- Configuration ---
BOT_TOKEN = os.environ.get("BOT_TOKEN")
API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000")

if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN environment variable is required")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# --- API Helpers ---

async def api_get(path: str) -> list | dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{API_BASE}{path}", timeout=10)
        resp.raise_for_status()
        return resp.json()

async def api_post(path: str, data: dict) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{API_BASE}{path}", json=data, timeout=10)
        resp.raise_for_status()
        return resp.json()

async def api_put(path: str, data: dict) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.put(f"{API_BASE}{path}", json=data, timeout=10)
        resp.raise_for_status()
        return resp.json()

async def api_delete(path: str) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.delete(f"{API_BASE}{path}", timeout=10)
        resp.raise_for_status()

# --- Helper Functions ---

def format_todos(todos: list) -> str:
    if not todos:
        return "📋 目前沒有代辦事項。"
    lines = []
    for t in todos:
        status = "✅" if t["completed"] else "⬜"
        lines.append(f"`{t['id']:>2}` {status} {t['title']}")
    return "📋 *代辦事項*\n" + "\n".join(lines)

def format_notes(notes: list) -> str:
    if not notes:
        return "📝 目前沒有記事。"
    lines = []
    for n in notes:
        preview = n["content"][:40] + "..." if len(n["content"]) > 40 else n["content"]
        tag = f" — _{preview}_" if preview else ""
        lines.append(f"`{n['id']:>2}` 📝 {n['title']}{tag}")
    return "📝 *記事本*\n" + "\n".join(lines)

# --- Command Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "🤖 *my-todo Telegram Bot*\n\n"
        "*/tasks* — 列出代辦事項\n"
        "*/add 標題* — 新增代辦\n"
        "*/done 編號* — 切換完成狀態\n"
        "*/edit 編號 新標題* — 修改標題\n"
        "*/del 編號* — 刪除代辦\n\n"
        "*/notes* — 列出記事\n"
        "*/addnote 標題|內容* — 新增記事\n"
        "*/delnote 編號* — 刪除記事"
    )
    await update.message.reply_text(help_text, parse_mode="Markdown")

async def tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        todos = await api_get("/api/todos")
        text = format_todos(todos)
        keyboard = []
        for t in todos:
            btn_text = f"{'✅' if t['completed'] else '⬜'} {t['title'][:20]}"
            keyboard.append([
                InlineKeyboardButton(btn_text, callback_data=f"todo_toggle_{t['id']}"),
                InlineKeyboardButton("🗑️", callback_data=f"todo_del_{t['id']}"),
            ])
        reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None
        await update.message.reply_text(text, parse_mode="Markdown", reply_markup=reply_markup)
    except Exception as e:
        logger.error(f"Error in tasks: {e}")
        await update.message.reply_text("❌ 無法取得代辦事項，後端是否在執行？")

async def add_todo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    title = " ".join(context.args)
    if not title:
        await update.message.reply_text("請輸入代辦事項內容，例如：`/add 買牛奶`", parse_mode="Markdown")
        return
    try:
        await api_post("/api/todos", {"title": title})
        await update.message.reply_text(f"✅ 已新增：{title}")
    except Exception as e:
        logger.error(f"Error in add: {e}")
        await update.message.reply_text("❌ 新增失敗")

async def done_todo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("請輸入編號，例如：`/done 1`", parse_mode="Markdown")
        return
    try:
        todo_id = int(context.args[0])
        todos = await api_get("/api/todos")
        todo = next((t for t in todos if t["id"] == todo_id), None)
        if not todo:
            await update.message.reply_text(f"❌ 找不到編號 {todo_id} 的代辦事項")
            return
        new_status = not todo["completed"]
        await api_put(f"/api/todos/{todo_id}", {"completed": new_status})
        status_text = "已完成" if new_status else "未完成"
        await update.message.reply_text(f"✅ 已將「{todo['title']}」設為{status_text}")
    except ValueError:
        await update.message.reply_text("❌ 請輸入有效的數字編號")

async def edit_todo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if len(context.args) < 2:
        await update.message.reply_text("請輸入編號和新標題，例如：`/edit 1 去全聯買牛奶`", parse_mode="Markdown")
        return
    try:
        todo_id = int(context.args[0])
        new_title = " ".join(context.args[1:])
        await api_put(f"/api/todos/{todo_id}", {"title": new_title})
        await update.message.reply_text(f"✅ 已更新為：{new_title}")
    except ValueError:
        await update.message.reply_text("❌ 請輸入有效的數字編號")

async def del_todo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("請輸入編號，例如：`/del 1`", parse_mode="Markdown")
        return
    try:
        todo_id = int(context.args[0])
        await api_delete(f"/api/todos/{todo_id}")
        await update.message.reply_text(f"🗑️ 已刪除代辦 #{todo_id}")
    except ValueError:
        await update.message.reply_text("❌ 請輸入有效的數字編號")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            await update.message.reply_text(f"❌ 找不到編號 {context.args[0]} 的代辦事項")
        else:
            await update.message.reply_text("❌ 刪除失敗")

async def notes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        notes_list = await api_get("/api/notes")
        text = format_notes(notes_list)
        keyboard = []
        for n in notes_list:
            keyboard.append([
                InlineKeyboardButton(f"📝 {n['title'][:25]}", callback_data=f"note_view_{n['id']}"),
                InlineKeyboardButton("🗑️", callback_data=f"note_del_{n['id']}"),
            ])
        reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None
        await update.message.reply_text(text, parse_mode="Markdown", reply_markup=reply_markup)
    except Exception as e:
        logger.error(f"Error in notes: {e}")
        await update.message.reply_text("❌ 無法取得記事，後端是否在執行？")

async def add_note(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = " ".join(context.args)
    if not text:
        await update.message.reply_text("請輸入記事內容，例如：`/addnote 會議重點|下午2點開會`", parse_mode="Markdown")
        return
    parts = text.split("|", 1)
    title = parts[0].strip()
    content = parts[1].strip() if len(parts) > 1 else ""
    try:
        note = await api_post("/api/notes", {"title": title})
        if content:
            await api_put(f"/api/notes/{note['id']}", {"content": content})
        await update.message.reply_text(f"✅ 已新增記事：{title}")
    except Exception as e:
        logger.error(f"Error in addnote: {e}")
        await update.message.reply_text("❌ 新增失敗")

async def del_note(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("請輸入編號，例如：`/delnote 1`", parse_mode="Markdown")
        return
    try:
        note_id = int(context.args[0])
        await api_delete(f"/api/notes/{note_id}")
        await update.message.reply_text(f"🗑️ 已刪除記事 #{note_id}")
    except ValueError:
        await update.message.reply_text("❌ 請輸入有效的數字編號")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            await update.message.reply_text(f"❌ 找不到編號 {context.args[0]} 的記事")
        else:
            await update.message.reply_text("❌ 刪除失敗")

# --- Callback Query Handler (Inline Keyboard) ---

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data

    try:
        if data.startswith("todo_toggle_"):
            todo_id = int(data.split("_")[-1])
            todos = await api_get("/api/todos")
            todo = next((t for t in todos if t["id"] == todo_id), None)
            if todo:
                new_status = not todo["completed"]
                await api_put(f"/api/todos/{todo_id}", {"completed": new_status})
                await query.edit_message_text(
                    format_todos(await api_get("/api/todos")),
                    parse_mode="Markdown",
                )

        elif data.startswith("todo_del_"):
            todo_id = int(data.split("_")[-1])
            await api_delete(f"/api/todos/{todo_id}")
            await query.edit_message_text(
                format_todos(await api_get("/api/todos")),
                parse_mode="Markdown",
            )

        elif data.startswith("note_view_"):
            note_id = int(data.split("_")[-1])
            notes_list = await api_get("/api/notes")
            note = next((n for n in notes_list if n["id"] == note_id), None)
            if note:
                time = note["updated_at"][:16]
                text = f"📝 *{note['title']}*\n_{time}_\n\n{note['content'] or '（無內容）'}"
                await query.edit_message_text(text, parse_mode="Markdown")

        elif data.startswith("note_del_"):
            note_id = int(data.split("_")[-1])
            await api_delete(f"/api/notes/{note_id}")
            await query.edit_message_text(
                format_notes(await api_get("/api/notes")),
                parse_mode="Markdown",
            )
    except Exception as e:
        logger.error(f"Callback error: {e}")
        await query.edit_message_text("❌ 操作失敗")

# --- Main ---

def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("tasks", tasks))
    app.add_handler(CommandHandler("add", add_todo))
    app.add_handler(CommandHandler("done", done_todo))
    app.add_handler(CommandHandler("edit", edit_todo))
    app.add_handler(CommandHandler("del", del_todo))
    app.add_handler(CommandHandler("notes", notes))
    app.add_handler(CommandHandler("addnote", add_note))
    app.add_handler(CommandHandler("delnote", del_note))
    app.add_handler(CallbackQueryHandler(button_callback))

    logger.info("Bot started!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
