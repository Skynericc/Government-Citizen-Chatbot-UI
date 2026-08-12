/* ------------------------------------------------------------------ */
/* Client-side conversation/session state for the `agent` chat flow.   */
/*                                                                      */
/* Why this exists: keep the React layer focused on rendering, while    */
/* encapsulating storage concerns (sessionStorage today; swappable       */
/* later for localStorage/Redis-backed bridge with minimal churn).       */
/* ------------------------------------------------------------------ */

const SESSION_STORAGE_KEY = "citizen-assistant-session-id";
const HISTORY_STORAGE_KEY = "citizen-assistant-history";
export const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_MESSAGES = MAX_HISTORY_TURNS * 2;

function createSessionId() {
	return crypto.randomUUID();
}

function getStorage() {
	try {
		return sessionStorage;
	} catch {
		return null;
	}
}

function readJson(key, fallback) {
	const storage = getStorage();
	if (!storage) return fallback;
	try {
		const raw = storage.getItem(key);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		return parsed ?? fallback;
	} catch {
		return fallback;
	}
}

function writeJson(key, value) {
	const storage = getStorage();
	if (!storage) return;
	try {
		storage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage can fail in privacy mode or when quota is exceeded.
	}
}

function normalizeMessage(message) {
	const role = message?.role;
	const content = typeof message?.content === "string" ? message.content : "";
	if (role !== "user" && role !== "assistant") return null;
	return { role, content };
}

function limitHistory(history) {
	return history.slice(-MAX_HISTORY_MESSAGES);
}

/**
 * Starts a brand-new conversation: a fresh session_id, and the stored
 * history wiped. Per the UI spec, the assistant must not retain a history
 * of past conversations — this is called both on every app mount (so a
 * page refresh behaves the same way) and from the "New conversation"
 * button in CitizenAssistant.jsx.
 */
export function resetSession() {
	const created = createSessionId();
	const storage = getStorage();
	if (storage) {
		try {
			storage.setItem(SESSION_STORAGE_KEY, created);
			storage.removeItem(HISTORY_STORAGE_KEY);
		} catch {
			// Storage can fail in privacy mode or when quota is exceeded —
			// the in-memory id returned below still works for this page load.
		}
	}
	return created;
}

export function getHistory() {
	const history = readJson(HISTORY_STORAGE_KEY, []);
	if (!Array.isArray(history)) return [];
	return limitHistory(history
		.map(normalizeMessage)
		.filter(Boolean));
}

function setHistory(history) {
	writeJson(HISTORY_STORAGE_KEY, limitHistory(history));
}

export function addUserMessage(content) {
	const next = limitHistory([...getHistory(), { role: "user", content: content || "" }]);
	setHistory(next);
	return next;
}

export function addAssistantMessage(content) {
	const next = limitHistory([...getHistory(), { role: "assistant", content: content || "" }]);
	setHistory(next);
	return next;
}

export function clearHistory() {
	setHistory([]);
}
