const $ = id => document.getElementById(id);

function setAuthUI(session) {
  const logged = Boolean(session?.user);
  $("aiBox").hidden = !logged;
  $("emailInput").disabled = logged;
  $("passwordInput").disabled = logged;
  $("loginBtn").hidden = logged;
  $("signupBtn").hidden = logged;
  $("authStatus").textContent = logged ? `Conectado: ${session.user.email || "usuário"}` : "Entre para usar o motor Neural-iA.";
}

async function refreshSession() {
  try {
    const session = await NeuralAPI.session();
    setAuthUI(session);
  } catch (error) {
    $("authStatus").textContent = error.message;
  }
}

async function auth(action) {
  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;
  if (!email || !password) return $("authStatus").textContent = "Informe e-mail e senha.";
  try {
    $("authStatus").textContent = "Processando...";
    if (action === "signup") await NeuralAPI.signUp(email, password);
    else await NeuralAPI.signIn(email, password);
    await refreshSession();
  } catch (error) {
    $("authStatus").textContent = `Erro: ${error.message}`;
  }
}

async function testarIA() {
  const prompt = $("promptInput").value.trim();
  const type = $("typeSelect").value;
  if (!prompt) return $("output").textContent = "Digite uma pergunta.";
  const btn = $("sendBtn");
  btn.disabled = true;
  $("output").textContent = "Pensando...";
  try {
    const data = await NeuralAPI.callAI(prompt, type);
    const answer = data?.response ?? data?.answer ?? data?.message ?? data?.choices?.[0]?.message?.content;
    $("output").textContent = typeof answer === "string" ? answer : JSON.stringify(data, null, 2);
  } catch (error) {
    $("output").textContent = error.message === "AUTH_REQUIRED" ? "Sessão expirada. Entre novamente." : `Erro: ${error.message}`;
  } finally {
    btn.disabled = false;
  }
}

$("loginBtn").addEventListener("click", () => auth("login"));
$("signupBtn").addEventListener("click", () => auth("signup"));
$("sendBtn").addEventListener("click", testarIA);
$("logoutBtn").addEventListener("click", async () => { await NeuralAPI.signOut(); await refreshSession(); });

try {
  NeuralAPI.getClient().auth.onAuthStateChange((_event, session) => setAuthUI(session));
  refreshSession();
} catch (error) {
  $("authStatus").textContent = `Configuração pendente: ${error.message}`;
}
