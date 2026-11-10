const express = require('express')
const cors = require('cors')
const db = require('./database')

const app = express()
const PORT = 3001

app.use(cors()) // Autoriser les requêtes provenant du frontend
app.use(express.json()) // pour utiliser la bibliotheque express de node.js

// Endpoint pour vérifier si le backend fonctionne
app.get('/api/health', (request, response) => {
  response.json({
    status: 'ok',
    message: 'Le backend fonctionne !'
  })
})

// Endpoints pour gérer les conversations(selectionner toutes les conversations)
app.get('/api/conversations', (request, response) => {
  const conversations = db
    .prepare('SELECT * FROM conversations ORDER BY created_at DESC')
    .all()

  response.json(conversations)
})

// Endpoint pour créer une nouvelle conversation
app.post('/api/conversations', (request, response) => {
  const result = db
    .prepare('INSERT INTO conversations (title) VALUES (?)')
    .run('Nouvelle discussion')
//On récupère cette conversation complète pour la renvoyer au frontend.
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(result.lastInsertRowid)

  response.status(201).json(conversation)
}) 

app.delete('/api/conversations/:conversationId', (request, response) => {
  const conversationId = Number(request.params.conversationId)

  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(conversationId)

  if (!conversation) {
    return response.status(404).json({
      error: 'Conversation introuvable.'
    })
  }

  db.prepare(
    'DELETE FROM messages WHERE conversation_id = ?',
  ).run(conversationId)

  db.prepare(
    'DELETE FROM conversations WHERE id = ?',
  ).run(conversationId)

  response.status(204).send()
})

// Endpoint pour mettre à jour le titre d'une conversation
app.patch('/api/conversations/:conversationId', (request, response) => {
  const conversationId = Number(request.params.conversationId)
  const title = request.body.title?.trim()

  if (!title) {
    return response.status(400).json({
      error: 'Le titre est obligatoire.'
    })
  }

  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(conversationId)

  if (!conversation) {
    return response.status(404).json({
      error: 'Conversation introuvable.'
    })
  }

  db.prepare(
    'UPDATE conversations SET title = ? WHERE id = ?',
  ).run(title, conversationId)

  const updatedConversation = db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(conversationId)

  response.json(updatedConversation)
})

// Endpoint pour ajouter un message à une conversation existante
app.post('/api/conversations/:conversationId/messages', (request, response) => {
  const conversationId = Number(request.params.conversationId)
  const content = request.body.content?.trim()

  if (!content) {
    return response.status(400).json({
      error: 'Le message est obligatoire.'
    })
  }

  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(conversationId)

  if (!conversation) {
    return response.status(404).json({
      error: 'Conversation introuvable.'
    })
  }
  const messageCount = db
  .prepare(
    'SELECT COUNT(*) AS total FROM messages WHERE conversation_id = ?',
  )
  .get(conversationId)

if (messageCount.total === 0) {
  const title =
    content.length > 35
      ? `${content.slice(0, 35)}...`
      : content

  db.prepare(
    'UPDATE conversations SET title = ? WHERE id = ?',
  ).run(title, conversationId)
}

  const result = db
    .prepare(`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (?, ?, ?)
    `)
    .run(conversationId, 'user', content)

    // On récupère le message utilisateur pour le renvoyer au frontend.
  const userMessage = db
  .prepare('SELECT * FROM messages WHERE id = ?')
  .get(result.lastInsertRowid)

  // On crée un message de l'assistant pour simuler une réponse.
const assistantContent = `Tu viens d’écrire : "${content}"`

// On insère le message de l'assistant dans la base de données.
const assistantResult = db
  .prepare(`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (?, ?, ?)
  `)
  .run(conversationId, 'assistant', assistantContent)

  // On récupère le message de l'assistant pour le renvoyer au frontend.
const assistantMessage = db
  .prepare('SELECT * FROM messages WHERE id = ?')
  .get(assistantResult.lastInsertRowid)

response.status(201).json({
  userMessage,
  assistantMessage
}) 

  
})

// Endpoint pour récupérer les messages d'une conversation
app.get('/api/conversations/:conversationId/messages', (request, response) => {
  const conversationId = Number(request.params.conversationId)

  const messages = db
    .prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `)
    .all(conversationId)

  response.json(messages)
})


// message si le backend fonctionne
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`)
})
