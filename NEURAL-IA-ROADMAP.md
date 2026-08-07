# 🧠 Neural-iA — Roadmap Oficial

> Status: Em desenvolvimento  
> Projeto: Neural-iA  
> Backend: Supabase Edge Functions  
> Frontend: HTML + CSS + JavaScript  
> Arquitetura: Modular

---

## Objetivo

Construir um Super App inteligente inspirado nas melhores experiências de IA, streaming e descoberta de conteúdo, utilizando APIs públicas, Edge Functions, Supabase e IA.

---

## ✅ Concluído

### Backend

- [x] Projeto Supabase conectado
- [x] `ai-server_chat`
- [x] JWT habilitado nas funções
- [x] Arquitetura modular
- [x] Camada central de consumo
- [x] `neural-search` criada
- [x] Gateway unificado entre categorias

### Edge Functions

#### IA
- [x] `ai-server_chat`
- [x] `neural-search`

#### Conhecimento
- [x] `books-search`
- [x] `knowledge-search`
- [x] `commons-search`
- [x] `archive-search`

#### Vídeos
- [x] `youtube-videos`
- [x] `peertube-videos`
- [x] `dailymotion-videos`
- [x] `vimeo-videos`
- [x] `tmdb-media`

#### Ciência
- [x] `nasa`
- [x] `papers-search`
- [x] `species-search`
- [x] `earthquakes`

#### Mundo
- [x] `weather`
- [x] `countries-search`
- [x] `holidays`
- [x] `exchange-rates`

#### Vida
- [x] `advice-search`
- [x] `quote-search`
- [x] `bible-search`
- [x] `recipes-search`
- [x] `food-search`

#### Entretenimento
- [x] `pokemon-search`
- [x] `rickmorty-search`

### Frontend

- [x] Supabase integrado
- [x] Login
- [x] Logout
- [x] JWT
- [x] `neural-api.js`
- [x] `supabase-config.js`
- [x] chamada autenticada
- [x] gateway `neural-search` como rota principal

### Documentação

- [x] Roadmap oficial criado
- [x] Regra de versionar melhorias no roadmap

---

## 📚 APIs integradas

### Streaming
- YouTube
- Vimeo
- PeerTube
- Dailymotion
- Internet Archive
- TMDB (metadados de mídia)

### Livros
- Open Library
- Gutenberg

### Ciência
- NASA
- Crossref
- OpenAlex
- GBIF

### Mundo
- Open Meteo
- REST Countries
- Nager
- Frankfurter

### Conteúdo
- Wikipedia
- Wikimedia Commons

### Alimentação
- Open Food Facts
- TheMealDB

### Outros
- Advice Slip
- Quotable
- Bíblia Digital

---

## 🔌 Sistema de módulos / plugins

O Neural-iA foi pensado para funcionar como um **Neural Hub**: cada funcionalidade principal vira um módulo ativável, consultado dinamicamente pelo app.

### Módulos previstos
- Neural IA
- Neural Vídeos
- Neural Books
- Neural Clima
- Neural Ciência
- Neural Receitas
- Neural Biblioteca
- Neural Favoritos
- Neural Configurações
- Neural Histórico

### Tabelas planejadas para suportar plugins
- `plugins`
- `api_sources`
- `categories`
- `search_cache`
- `user_settings`
- `collections`
- `history`
- `favorites`
- `chat_sessions`
- `chat_messages`
- `profiles`

---

## 🔊 Sons e sonorização

### Regra aprovada
O app terá som apenas para eventos relevantes, sem poluir a experiência.

### Eventos com som
- Conteúdo novo encontrado pelas Edge Functions
- Mensagem recebida quando o usuário estiver em outro app ou em segundo plano
- Recomendações novas
- Efeitos curtos de recursos e ações importantes

### Eventos sem som
- Navegação comum
- Interações repetitivas
- Resultados já conhecidos em cache

### Objetivo
Criar uma camada de **Neural Sound** com controle de volume, ativação/desativação e sons leves para interface e notificações.

---

## 🎯 Próximas etapas

### Interface
- [ ] Layout estilo Netflix
- [ ] Layout estilo Mercado Play
- [ ] Interface Gemini
- [ ] Interface Copilot
- [ ] Glass UI
- [ ] Tema escuro premium
- [ ] Material Design 3
- [ ] Lucide Icons

### Menu
- [ ] Drawer lateral
- [ ] Biblioteca
- [ ] Histórico
- [ ] Favoritos
- [ ] Configurações
- [ ] Conta

### IA
- [ ] Chat contínuo
- [ ] Memória de conversa
- [ ] Upload de imagem
- [ ] OCR
- [ ] Voz
- [ ] TTS
- [ ] STT

### Vídeos
- [ ] Player próprio
- [ ] Continuar assistindo
- [ ] Recomendações
- [ ] Categorias
- [ ] Favoritos
- [ ] Histórico
- [ ] Busca inteligente

### Motor Neural
- [ ] Cache
- [ ] Ranking
- [ ] Deduplicação
- [ ] Plugins
- [ ] Descoberta automática
- [ ] Logs
- [ ] Analytics

### Offline
- [ ] PWA
- [ ] Cache offline
- [ ] Service Worker
- [ ] Sincronização

### Segurança
- [ ] Rate limit
- [ ] Auditoria
- [ ] Monitoramento
- [ ] Logs
- [ ] Métricas

---

## 🎨 Identidade visual

### Inspirações
- Netflix
- Mercado Play
- Gemini
- Copilot

### Componentes
- Lucide Icons
- Material Design 3
- Glassmorphism
- Motion
- Skeleton loading
- Lazy loading

---

## 🎯 Objetivo final

Criar um Super App inteligente onde o usuário tenha acesso a:

- IA
- Vídeos
- Livros
- Ciência
- Clima
- Notícias
- Conhecimento
- Streaming
- Pesquisa universal

Tudo através de uma única interface, alimentada pelo Neural Search.
