/* ------------------------------------------------------------------ */
/* Client-side conversation/session state for the `agent` chat flow.   */
/*                                                                      */
/* Why this exists: keep the React layer focused on rendering, while    */
/* encapsulating storage concerns (sessionStorage today; swappable       */
/* later for localStorage/Redis-backed bridge with minimal churn).       */
/* ------------------------------------------------------------------ */

const SESSION_STORAGE_KEY = "citizen-assistant-session-id";
const HISTORY_STORAGE_KEY = "citizen-assistant-history";

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

export function getSessionId() {
	const storage = getStorage();
	if (!storage) return createSessionId();

	try {
		const existing = storage.getItem(SESSION_STORAGE_KEY);
		if (existing) return existing;
		const created = createSessionId();
		storage.setItem(SESSION_STORAGE_KEY, created);
		return created;
	} catch {
		return createSessionId();
	}
}

export function getHistory() {
	const history = readJson(HISTORY_STORAGE_KEY, []);
	if (!Array.isArray(history)) return [];
	return history
		.map(normalizeMessage)
		.filter(Boolean);
}

function setHistory(history) {
	writeJson(HISTORY_STORAGE_KEY, history);
}

export function addUserMessage(content) {
	const next = [...getHistory(), { role: "user", content: content || "" }];
	setHistory(next);
	return next;
}

export function addAssistantMessage(content) {
	const next = [...getHistory(), { role: "assistant", content: content || "" }];
	setHistory(next);
	return next;
}

export function clearHistory() {
	setHistory([]);
}
