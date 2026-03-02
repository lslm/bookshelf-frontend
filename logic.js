/* ─── Configuração ───────────────────────────────────────────────── */
const API_URL = 'http://localhost:8080/api/books';

/* ─── Elementos do DOM ───────────────────────────────────────────── */
const bookForm    = document.getElementById('book-form');
const bookIdInput = document.getElementById('book-id');
const titleInput  = document.getElementById('title');
const authorInput = document.getElementById('author');
const yearInput   = document.getElementById('year');
const submitBtn   = document.getElementById('submit-btn');
const cancelBtn   = document.getElementById('cancel-btn');
const formTitle   = document.getElementById('form-title');
const bookCount   = document.getElementById('book-count');
const bookTbody   = document.getElementById('book-tbody');
const statusMsg   = document.getElementById('status-msg');

/* ─── Checagem de status HTTP ────────────────────────────────────── */
function checkStatus(response) {
  const status = response.status;

  if (status >= 200 && status < 300) {
    console.log(`[${status}] Requisição bem-sucedida: ${response.url}`);
    return response; // sucesso — continua o fluxo
  }

  // Erros do cliente (4xx)
  if (status === 400) throw new Error(`400 Bad Request — dados inválidos enviados.`);
  if (status === 401) throw new Error(`401 Unauthorized — autenticação necessária.`);
  if (status === 403) throw new Error(`403 Forbidden — acesso negado.`);
  if (status === 404) throw new Error(`404 Not Found — recurso não encontrado.`);
  if (status === 409) throw new Error(`409 Conflict — conflito com o estado atual.`);

  // Erros do servidor (5xx)
  if (status >= 500) throw new Error(`${status} Server Error — falha interna no servidor.`);

  // Qualquer outro status fora do intervalo 2xx
  throw new Error(`HTTP ${status} — resposta inesperada.`);
}

/* ─── Fetch helper ───────────────────────────────────────────────── */
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  checkStatus(response);

  // DELETE retorna texto plano
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return text; }
}

/* ─── Renderizar tabela ──────────────────────────────────────────── */
function renderBooks(books) {
  bookCount.textContent = books.length;
  bookTbody.innerHTML = '';

  if (books.length === 0) {
    statusMsg.textContent = 'Nenhum livro cadastrado ainda.';
    return;
  }

  statusMsg.textContent = '';

  books.forEach(book => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${book.id}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.year}</td>
      <td>
        <button onclick="startEdit(${book.id}, '${book.title}', '${book.author}', ${book.year})">Editar</button>
        <button onclick="deleteBook(${book.id})">Excluir</button>
      </td>
    `;

    bookTbody.appendChild(tr);
  });
}

/* ─── GET all ────────────────────────────────────────────────────── */
async function loadBooks() {
  statusMsg.textContent = 'Carregando...';
  try {
    const books = await apiFetch(API_URL);
    renderBooks(books);
  } catch (err) {
    statusMsg.textContent = 'Erro ao conectar à API: ' + err.message;
  }
}

/* ─── POST ───────────────────────────────────────────────────────── */
async function createBook(book) {
  const created = await apiFetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(book),
  });
  alert(`Livro "${created.title}" adicionado com sucesso!`);
  return created;
}

/* ─── PUT ────────────────────────────────────────────────────────── */
async function updateBook(id, book) {
  const updated = await apiFetch(`${API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(book),
  });
  alert(`Livro "${updated.title}" atualizado com sucesso!`);
  return updated;
}

/* ─── DELETE ─────────────────────────────────────────────────────── */
async function deleteBook(id) {
  if (!confirm('Tem certeza que deseja excluir este livro?')) return;
  try {
    const msg = await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    alert(msg || 'Livro excluído!');
    loadBooks();
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}

/* ─── Formulário: submit ─────────────────────────────────────────── */
bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id     = bookIdInput.value;
  const title  = titleInput.value.trim();
  const author = authorInput.value.trim();
  const year   = parseInt(yearInput.value);

  if (!title || !author || !year) {
    alert('Preencha todos os campos!');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Aguarde...';

  try {
    if (id) {
      await updateBook(id, { title, author, year });
    } else {
      await createBook({ title, author, year });
    }
    resetForm();
    loadBooks();
  } catch (err) {
    alert('Erro: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    updateSubmitBtn();
  }
});

/* ─── Modo Edição ────────────────────────────────────────────────── */
function startEdit(id, title, author, year) {
  bookIdInput.value  = id;
  titleInput.value   = title;
  authorInput.value  = author;
  yearInput.value    = year;
  formTitle.textContent = 'Editar Livro';
  submitBtn.textContent = 'Salvar Alterações';
  cancelBtn.hidden = false;
  titleInput.focus();
}

function resetForm() {
  bookForm.reset();
  bookIdInput.value = '';
  cancelBtn.hidden = true;
  updateSubmitBtn();
}

function updateSubmitBtn() {
  formTitle.textContent = 'Adicionar Livro';
  submitBtn.textContent = 'Adicionar Livro';
}

cancelBtn.addEventListener('click', resetForm);

/* ─── Inicialização ──────────────────────────────────────────────── */
loadBooks();
