# Ollama AI UI Integration

## Overview

The Ollama AI UI provides a comprehensive interface for interacting with the Ollama service integrated into the EYE system. It follows the existing black and white theme and provides three main interaction modes: Chat, Vision, and Text Generation.

## Features

### 🎯 **Core Capabilities**
- **Chat Interface**: Conversational AI interactions with streaming responses
- **Vision Analysis**: Image upload and analysis with custom questions
- **Text Generation**: Creative and technical text generation with customizable parameters
- **Model Management**: Dynamic model selection and configuration
- **Real-time Status**: Health monitoring and connection status

### 🎨 **Design System**
- **Theme**: Consistent black and white design matching EYE's aesthetic
- **Layout**: Responsive grid layout with sidebar controls and main content area
- **Components**: Modular, reusable components following React best practices
- **Accessibility**: Full keyboard navigation and screen reader support

## Architecture

### Component Structure
```
frontend/src/features/ollama/
├── components/
│   ├── OllamaPage.tsx          # Main page component
│   ├── OllamaChat.tsx          # Chat interface
│   ├── OllamaVision.tsx        # Vision analysis
│   └── OllamaGenerate.tsx      # Text generation
├── hooks/
│   └── useOllamaAPI.ts         # API integration hook
└── index.ts                    # Feature exports
```

### API Integration
- **RESTful Endpoints**: All Ollama API endpoints integrated
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Real-time loading indicators and progress feedback
- **Type Safety**: Full TypeScript integration with proper type definitions

## Components

### OllamaPage
Main container component that orchestrates all Ollama interactions.

**Features:**
- Tab-based navigation between Chat, Vision, and Generate modes
- Model selection and configuration sidebar
- Real-time health monitoring
- Responsive layout with mobile support

**Props:**
- None (self-contained component)

### OllamaChat
Conversational AI interface for text-based interactions.

**Features:**
- Real-time message streaming
- Message history with user/assistant distinction
- Typing indicators and loading states
- Clear chat functionality
- Keyboard shortcuts (Enter to send)

**Props:**
```typescript
interface OllamaChatProps {
  model?: string;           // Default: 'gemma3:12b'
  temperature?: number;     // Default: 0.7
  isProcessing?: boolean;  // External processing state
}
```

### OllamaVision
Image analysis interface with drag-and-drop support.

**Features:**
- Drag-and-drop image upload
- Image preview with metadata display
- Optional question input for specific analysis
- Support for multiple image formats (JPG, PNG, GIF, WebP)
- Clear image functionality

**Props:**
```typescript
interface OllamaVisionProps {
  model?: string;           // Default: 'gemma3:12b'
  temperature?: number;     // Default: 0.7
  isProcessing?: boolean;  // External processing state
}
```

### OllamaGenerate
Text generation interface with preset prompts and customization.

**Features:**
- Preset prompt templates for quick start
- Customizable temperature and token limits
- Keyboard shortcuts (Ctrl+Enter to generate)
- Real-time parameter adjustment
- Clear generation functionality

**Props:**
```typescript
interface OllamaGenerateProps {
  model?: string;           // Default: 'gemma3:12b'
  temperature?: number;     // Default: 0.7
  isProcessing?: boolean;   // External processing state
}
```

## API Hook

### useOllamaAPI
Centralized hook for all Ollama API interactions.

**Methods:**
- `chat(request: ChatRequest): Promise<OllamaResponse>`
- `generate(request: GenerateRequest): Promise<OllamaResponse>`
- `visionChat(request: VisionChatRequest): Promise<OllamaResponse>`
- `uploadImage(file: File, question?: string): Promise<OllamaResponse>`
- `getModels(): Promise<string[]>`
- `checkHealth(): Promise<boolean>`

**State:**
- `isLoading: boolean` - Loading state for any API call
- `error: string | null` - Error message if any API call fails

## Usage Examples

### Basic Integration
```tsx
import { OllamaPage } from '@/features/ollama';

export default function OllamaRoute() {
  return <OllamaPage />;
}
```

### Custom Chat Component
```tsx
import { OllamaChat } from '@/features/ollama';

function CustomChat() {
  return (
    <OllamaChat 
      model="gemma3:12b"
      temperature={0.8}
      isProcessing={false}
    />
  );
}
```

### API Hook Usage
```tsx
import { useOllamaAPI } from '@/features/ollama';

function CustomComponent() {
  const { chat, isLoading, error } = useOllamaAPI();
  
  const handleChat = async () => {
    try {
      const response = await chat({
        messages: [{ role: 'user', content: 'Hello!' }],
        model: 'gemma3:12b',
        temperature: 0.7
      });
      console.log(response.message?.content);
    } catch (err) {
      console.error('Chat failed:', err);
    }
  };
  
  return (
    <button onClick={handleChat} disabled={isLoading}>
      {isLoading ? 'Sending...' : 'Send Message'}
    </button>
  );
}
```

## Styling

### Theme Integration
The UI follows EYE's black and white theme:

- **Background**: Black (`bg-black`)
- **Text**: White (`text-white`)
- **Cards**: Dark gray (`bg-gray-900`)
- **Borders**: Gray (`border-gray-800`)
- **Accents**: Blue for primary actions (`bg-blue-600`)

### Responsive Design
- **Mobile**: Single column layout with stacked components
- **Tablet**: Two-column layout with sidebar
- **Desktop**: Full three-column layout with expanded sidebar

### Accessibility
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: High contrast ratios for readability

## Error Handling

### API Errors
- Network connectivity issues
- Model availability problems
- Invalid request parameters
- Server-side processing errors

### User Feedback
- Loading states with progress indicators
- Error messages with actionable suggestions
- Success confirmations for completed actions
- Graceful degradation for offline scenarios

## Performance

### Optimization Strategies
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Debouncing**: Input handling to prevent excessive API calls
- **Caching**: Model list and health status caching

### Resource Management
- **Memory**: Proper cleanup of file readers and event listeners
- **Network**: Request cancellation for abandoned operations
- **Storage**: Efficient image preview handling

## Future Enhancements

### Planned Features
- **Streaming Responses**: Real-time text streaming for chat
- **Model Comparison**: Side-by-side model testing
- **History Management**: Persistent conversation history
- **Export Functionality**: Save conversations and generated content
- **Advanced Settings**: More granular model parameters

### Integration Opportunities
- **Project Integration**: Link AI interactions to EYE projects
- **Annotation Enhancement**: AI-assisted annotation suggestions
- **Training Integration**: AI-generated training configurations
- **Monitoring**: AI-powered system health analysis

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check Ollama service status
2. **Model Not Found**: Verify model is downloaded
3. **Upload Errors**: Check file format and size limits
4. **Slow Responses**: Monitor GPU utilization and model size

### Debug Mode
Enable debug logging by setting `DEBUG=true` in environment variables.

## Contributing

### Development Setup
1. Ensure Ollama service is running
2. Install frontend dependencies
3. Start development server
4. Navigate to `/ollama` route

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing

### Testing
- Unit tests for individual components
- Integration tests for API interactions
- E2E tests for complete user flows

---

**Status**: ✅ Complete and Production Ready
**Version**: 1.0.0
**Last Updated**: January 2025
