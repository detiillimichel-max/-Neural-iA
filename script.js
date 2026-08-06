const $ = id => document.getElementById(id);

function setAuthUI(session) {
  const logged = Boolean(session?.user);
  $("aiBox").hidden = !logged;
  $("emailInput").disabled = logged;
  $("passwordInput").disabled = logged;
  $("loginBtn").hidden = logged;
  $("signupBtn").hidden = logged;
  $("resendBtn").hidden = logged;
  $("authStatus").textContent = logged ? `Conectado: ${session.user.email || "usuário"}` : "Entre para usar o motor Neural-iA.";
}

function friendlyAuthMessage(error) {
  const msg = String(error?.message || error || "");
  if (/email not confirmed/i.test(msg)) return "Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada e o spam.";
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha inválidos.";
  if (/signup disabled/i.test(msg)) return "Cadastro desativado neste momento.";
  return msg || "Erro de autenticação.";
}

async function refreshSession() {
  try {
    const session = await NeuralAPI.session();
    setAuthUI(session);
  } catch (error) {
    $("authStatus").textContent = friendlyAuthMessage(error);
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
    if (action === "signup") $("authStatus").textContent = "Conta criada. Verifique seu e-mail para confirmar o cadastro.";
  } catch (error) {
    $("authStatus").textContent = friendlyAuthMessage(error);
  }
}

async function resendConfirmation() {
  const email = $("emailInput").value.trim();
  if (!email) return $("authStatus").textContent = "Digite seu e-mail para reenviar a confirmação.";
  try {
    $("authStatus").textContent = "Reenviando confirmação...";
    const { error } = await NeuralAPI.getClient().auth.resend({ type: "signup", email });
    if (error) throw error;
    $("authStatus").textContent = "E-mail de confirmação reenviado.";
  } catch (error) {
    $("authStatus").textContent = friendlyAuthMessage(error);
  }
}

async function searchGateway() {
  const query = $("promptInput").value.trim();
  if (!query) return $("output").textContent = "Digite um termo para buscar.";
  const btn = $("sendBtn");
  btn.disabled = true;
  $("output").textContent = "Buscando no gateway...";
  try {
    const data = await NeuralAPI.invoke("neural-search", { type: "assistant", query });
    $("output").textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    $("output").textContent = `Erro: ${error.message}`;
  } finally {
    btn.disabled = false;
  }
}

$("loginBtn").addEventListener("click", () => auth("login"));
$("signupBtn").addEventListener("click", () => auth("signup"));
$("resendBtn").addEventListener("click", resendConfirmation);
$("sendBtn").addEventListener("click", searchGateway);
$("logoutBtn").addEventListener("click", async () => { await NeuralAPI.signOut(); await refreshSession(); });

try {
  NeuralAPI.getClient().auth.onAuthStateChange((_event, session) => setAuthUI(session));
  refreshSession();
} catch (error) {
  $("authStatus").textContent = `Configuração pendente: ${friendlyAuthMessage(error)}`;
}
