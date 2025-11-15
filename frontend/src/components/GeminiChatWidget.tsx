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
import Chip from '@mui/material/Chip'

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

// Static Q&A pairs for quick answers (fallback when API is unavailable)
const STATIC_QUESTIONS: Array<{ question: string; answer: string }> = [
  {
    question: 'How do I vote?',
    answer: 'To vote, simply select your preferred candidate(s) for each position. For positions that allow multiple votes, you can select multiple candidates using checkboxes. For single-vote positions, select one candidate using radio buttons. Once you\'ve made your selections, click "Submit Votes" to cast your ballot. You can edit your votes as long as the election is ongoing.',
  },
  {
    question: 'Can I change my vote?',
    answer: 'Yes! You can change your vote as long as the election is still ongoing. Simply select different candidates and click "Update Votes" to save your changes. Once the election ends, your votes are final and cannot be changed.',
  },
  {
    question: 'What does "Multiple votes allowed" mean?',
    answer: 'Some positions allow you to vote for multiple candidates. When you see the "Multiple votes allowed" badge, you can select more than one candidate for that position using checkboxes. For positions without this badge, you can only select one candidate.',
  },
  {
    question: 'How do I know if my vote was submitted?',
    answer: 'After clicking "Submit Votes" or "Update Votes", you\'ll see a success message confirming your votes were saved. You\'ll also see a green badge showing which candidates you voted for. If you see this badge, your vote has been successfully recorded.',
  },
  {
    question: 'What if I forgot my password?',
    answer: 'If you forgot your password, please contact the election administrators for assistance. They can help you reset your account credentials. Make sure to have your Voter ID ready when contacting them.',
  },
  {
    question: 'When does the election end?',
    answer: 'The election end date and time are displayed at the top of the election page. You can vote anytime between the start date and end date. Make sure to submit your votes before the election closes!',
  },
  {
    question: 'Can I vote for candidates from different parties?',
    answer: 'Yes, absolutely! You can vote for candidates from any party. Your votes are independent for each position - you can mix and match candidates from different parties as you see fit.',
  },
  {
    question: 'What happens if I don\'t vote?',
    answer: 'Voting is your civic right and responsibility. If you don\'t vote, you won\'t be able to influence the election outcome. We encourage all eligible voters to participate. However, voting is not mandatory - it\'s your choice.',
  },
  {
    question: 'Who should I vote for?',
    answer: 'Vote for candidates who demonstrate genuine leadership qualities and capabilities, not just because you know them personally. Consider their:\n\n• **Track Record**: Look at their past achievements and experience\n• **Vision**: Do they have clear plans and goals for the position?\n• **Integrity**: Are they honest, trustworthy, and ethical?\n• **Competence**: Do they have the skills and knowledge needed for the role?\n• **Commitment**: Are they dedicated to serving the community?\n\nRead candidate bios, review their platforms, and make an informed decision based on who can best lead and serve. Your vote should reflect who you believe will genuinely contribute to positive change, regardless of personal relationships.',
  },
]

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
  const [showStaticQuestions, setShowStaticQuestions] = React.useState(true)
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

  const handleStaticQuestion = (question: string, answer: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: answer,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    // Keep static questions visible so users can click multiple
    setInputValue('')
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      return
    }

    setShowStaticQuestions(false)

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
            {/* Static Questions - Show when dialog is open and user hasn't typed custom message */}
            {showStaticQuestions && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Quick Questions:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {STATIC_QUESTIONS.map((qa, index) => (
                    <Chip
                      key={index}
                      label={qa.question}
                      onClick={() => handleStaticQuestion(qa.question, qa.answer)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                        },
                      }}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

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

