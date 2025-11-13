import React from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  TextField,
  Button,
  Fab,
  CircularProgress,
  Tooltip,
  useMediaQuery,
  Stack,
  Paper,
} from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
  pending?: boolean
}

const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info('[GeminiChatWidget]', {
    model: import.meta.env.VITE_GEMINI_MODEL,
    apiUrl: GEMINI_API_URL,
  })
}

const SYSTEM_PROMPT = `You are Pollify's helpful election assistant. Guide voters on poll procedures, voting schedules, and platform usage. When asked about candidates, provide balanced, factual responses using the information shared by the voter. Encourage civic participation and respectful dialogue. If unsure, politely say you are not certain and suggest contacting the election administrators.`

const buildRequestBody = (messages: ChatMessage[], userInput: string) => {
  const history = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }))

  const promptWithInstruction = `Please follow these assistant guidelines:\n${SYSTEM_PROMPT}\n\nVoter message:\n${userInput}`

  return {
    contents: [
      ...history,
      {
        role: 'user',
        parts: [{ text: promptWithInstruction }],
      },
    ],
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }
}

const GeminiChatWidget: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        "Hi! I'm Pollify's election assistant. Ask me about voting guidelines or share your thoughts on the candidates.",
    },
  ])
  const [inputValue, setInputValue] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const prefersSmallScreen = useMediaQuery('(max-width:600px)')

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  const handleToggle = () => {
    setOpen((prev) => !prev)
    setError(null)
  }

  const handleClose = () => {
    setOpen(false)
    setError(null)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      return
    }

    if (!apiKey) {
      setError(
        'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment.'
      )
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
    }

    const pendingAssistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      pending: true,
    }

    setMessages((prev) => [...prev, userMessage, pendingAssistantMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildRequestBody(messages, userMessage.content)),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const errorMessage =
          data?.error?.message || `Gemini request failed (${response.status})`
        throw new Error(errorMessage)
      }

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? '')
          .join('\n')
          .trim() ?? ''

      if (!text) {
        throw new Error('Gemini returned an empty response.')
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.pending && message.id === pendingAssistantMessage.id
            ? { ...message, content: text, pending: false }
            : message
        )
      )
    } catch (err) {
      const fallbackMessage =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(fallbackMessage)
      setMessages((prev) => prev.filter((message) => !(message.pending && message.role === 'assistant')))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <Tooltip title="Chat with Pollify AI" placement="left">
        <Fab
          color="secondary"
          onClick={handleToggle}
          sx={{
            position: 'fixed',
            bottom: { xs: 88, sm: 32 },
            right: { xs: 24, sm: 32 },
            zIndex: (theme) => theme.zIndex.tooltip + 1,
          }}
        >
          <ChatIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        fullScreen={prefersSmallScreen}
        PaperProps={{
          sx: {
            borderRadius: prefersSmallScreen ? 0 : 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: 1,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Pollify AI Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask about election guidelines or share candidate feedback.
            </Typography>
          </Box>
          <IconButton onClick={handleClose} aria-label="Close chat">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: 'grey.50', p: 0 }}>
          <Box
            sx={{
              maxHeight: prefersSmallScreen ? 'calc(100vh - 200px)' : 420,
              overflowY: 'auto',
              p: 2,
            }}
          >
            <Stack spacing={2}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    elevation={message.role === 'assistant' ? 1 : 3}
                    sx={{
                      px: 2,
                      py: 1.5,
                      maxWidth: '80%',
                      bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                      color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                      borderTopRightRadius: message.role === 'user' ? 2 : 0,
                      borderTopLeftRadius: message.role === 'assistant' ? 2 : 0,
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.pending ? '…' : message.content}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <CircularProgress size={18} sx={{ ml: 1 }} />
                </Box>
              )}
            </Stack>
          </Box>

          {error && (
            <Box sx={{ bgcolor: 'error.light', color: 'error.contrastText', p: 1.5 }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            alignItems: 'flex-end',
            px: 2,
            py: 2,
            flexDirection: prefersSmallScreen ? 'column' : 'row',
            gap: 1,
          }}
        >
          <TextField
            multiline
            minRows={prefersSmallScreen ? 2 : 1}
            maxRows={4}
            fullWidth
            placeholder="Type your question..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            sx={{ minWidth: 120 }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default GeminiChatWidget

