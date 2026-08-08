const $ = id => document.getElementById(id);

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function show(id, visible) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle("hidden", !visible);
}

function setAuthUI(session) {
  const logged = Boolean(session?.user);
  show("authBox", !logged);
  show("appShell", logged);
  show("resendBtn", false);
  setText("authStatus", logged ? `Conectado: ${session.user.email || "usuário"}` : "Entre para usar o motor Neural-iA.");
}

async function refreshSession() {
  try {
    const session = await NeuralAPI.session();
    setAuthUI(session);
  } catch (error) {
    setText("authStatus", error.message);
  }
}

function authErrorMessage(error) {
  const msg = String(error?.message || "");
  if (/Email not confirmed/i.test(msg)) return "Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada/spam ou reenvie a confirmação.";
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha inválidos.";
  if (/already registered/i.test(msg)) return "Esta conta já existe. Tente entrar ou reenviar confirmação.";
  return `Erro: ${msg || "não foi possível autenticar"}`;
}

async function auth(action) {
  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;
  if (!email || !password) return setText("authStatus", "Informe e-mail e senha.");
  try {
    setText("authStatus", "Processando...");
    if (action === "signup") {
      await NeuralAPI.signUp(email, password);
      setText("authStatus", "Conta criada. Verifique seu e-mail para confirmar o cadastro.");
      show("resendBtn", true);
      return;
    }
    await NeuralAPI.signIn(email, password);
    await refreshSession();
  } catch (error) {
    setText("authStatus", authErrorMessage(error));
    show("resendBtn", /Email not confirmed/i.test(String(error?.message || "")));
  }
}

async function resendConfirmation() {
  const email = $("emailInput").value.trim();
  if (!email) return setText("authStatus", "Informe o e-mail para reenviar a confirmação.");
  try {
    setText("authStatus", "Reenviando confirmação...");
    await NeuralAPI.getClient().auth.resend({ type: "signup", email });
    setText("authStatus", "E-mail de confirmação reenviado. Verifique sua caixa de entrada/spam.");
  } catch (error) {
    setText("authStatus", `Erro ao reenviar: ${error.message}`);
  }
}

async function searchGateway() {
  const query = $("promptInput").value.trim();
  if (!query) return setText("output", "Digite um termo para buscar.");
  const btn = $("sendBtn");
  btn.disabled = true;
  setText("statusText", "Buscando no gateway...");
  setText("output", "Buscando no gateway...");
  try {
    const data = await NeuralAPI.invoke("neural-search", { type: "assistant", query });
    setText("output", JSON.stringify(data, null, 2));
    setText("statusText", "Busca concluída.");
  } catch (error) {
    setText("output", `Erro: ${error.message}`);
    setText("statusText", "Falha na busca.");
  } finally {
    btn.disabled = false;
  }
}

async function callAI() {
  const prompt = $("promptInput").value.trim();
  const type = $("typeSelect").value;
  if (!prompt) return setText("output", "Digite uma pergunta.");
  const btn = $("sendBtn");
  btn.disabled = true;
  setText("statusText", "Pensando...");
  setText("output", "Pensando...");
  try {
    const data = await NeuralAPI.callAI(prompt, type);
    const answer = data?.response ?? data?.answer ?? data?.message ?? data?.choices?.[0]?.message?.content;
    setText("output", typeof answer === "string" ? answer : JSON.stringify(data, null, 2));
    setText("statusText", "Resposta recebida.");
  } catch (error) {
    setText("output", error.message === "AUTH_REQUIRED" ? "Sessão expirada. Entre novamente." : `Erro: ${error.message}`);
    setText("statusText", "Falha na IA.");
  } finally {
    btn.disabled = false;
  }
}

function toggleDrawer() {
  const drawer = $("drawer");
  if (drawer) drawer.classList.toggle("hidden");
}

function closeDrawer() {
  const drawer = $("drawer");
  if (drawer) drawer.classList.add("hidden");
}

function navigateMenu(target) {
  switch (target) {
    case "home":
      closeDrawer();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;

    case "ai":
      window.location.href = "src/pages/ia.html";
      return;

    default:
      closeDrawer();
      setText("statusText", `${target} está em desenvolvimento. A estrutura será conectada ao próximo módulo.`);
  }
}

function bindUI() {
  $("loginBtn")?.addEventListener("click", () => auth("login"));
  $("signupBtn")?.addEventListener("click", () => auth("signup"));
  $("resendBtn")?.addEventListener("click", resendConfirmation);
  $("sendBtn")?.addEventListener("click", searchGateway);
  $("logoutBtn")?.addEventListener("click", async () => { await NeuralAPI.signOut(); await refreshSession(); });
  $("menuBtn")?.addEventListener("click", toggleDrawer);
  $("searchModeBtn")?.addEventListener("click", () => setText("statusText", "Modo de busca universal ativo."));

  document.querySelectorAll("[data-category]").forEach(btn => btn.addEventListener("click", () => {
    const category = btn.getAttribute("data-category");
    setText("statusText", `Categoria selecionada: ${category}`);
  }));

  document.querySelectorAll("#drawer [data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      navigateMenu(btn.getAttribute("data-target"));
    });
  });
}

try {
  NeuralAPI.getClient().auth.onAuthStateChange((_event, session) => setAuthUI(session));
  bindUI();
  refreshSession();
} catch (error) {
  setText("authStatus", `Configuração pendente: ${error.message}`);
}
