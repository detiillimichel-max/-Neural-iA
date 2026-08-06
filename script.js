// Cole abaixo a URL completa da sua Edge Function no Supabase
const EDGE_FUNCTION_URL = "https://avqvecghixhrpqxucubn.supabase.co/functions/v1/NOME_DA_SUA_FUNCAO";

async function testarIA() {
  const prompt = document.getElementById("promptInput").value;
  const type = document.getElementById("typeSelect").value;
  const output = document.getElementById("output");
  const btn = document.getElementById("sendBtn");

  if (!prompt.trim()) {
    alert("Por favor, digite uma mensagem antes de enviar!");
    return;
  }

  // Atualiza estado do botão e resultado
  btn.disabled = true;
  btn.innerText = "Processando...";
  output.innerText = "Consultando o AI-SERVER...";

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        type: type
      })
    });

    const data = await response.json();

    if (data.error) {
      output.innerText = "Erro do Servidor: " + data.error;
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      // Exibe o conteúdo retornado pela IA
      output.innerText = data.choices[0].message.content;
    } else {
      output.innerText = "Resposta inesperada:\n" + JSON.stringify(data, null, 2);
    }

  } catch (err) {
    output.innerText = "Erro na conexão: " + err.message;
  } finally {
    btn.disabled = false;
    btn.innerText = "Enviar Para o Server";
  }
}

