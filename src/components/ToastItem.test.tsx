import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ToastItem } from './ToastItem'
import type { Toast } from '../types/types'

describe('ToastItem', () => {
  const mockOnRemove = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createToast = (overrides: Partial<Toast> = {}): Toast => ({
    id: 'test-toast-1',
    message: 'Test message',
    type: 'success',
    duration: 3000,
    ...overrides,
  })

  it('должен вызвать onRemove после истечения времени, когда не наведен курсор', async () => {
    const toast = createToast()
    
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    
    // Fast-forward time until just before the toast should be removed
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Fast-forward the remaining time (triggers exit animation)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Fast-forward through the exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('должен приостановить таймер при наведении мыши и возобновить при уходе курсора', async () => {
    const toast = createToast({ duration: 3000 })
    
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    
    const toastElement = screen.getByText('Test message').parentElement!
    
    // Let 1 second pass
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Hover over the toast
    fireEvent.mouseEnter(toastElement)
    
    // Advance time by more than the remaining duration (2 seconds + extra)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Unhover from the toast
    fireEvent.mouseLeave(toastElement)
    
    // Advance time by the remaining duration (2 seconds)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Advance through the exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('должен корректно обрабатывать несколько циклов наведения', async () => {
    const toast = createToast({ duration: 3000 })
    
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    
    const toastElement = screen.getByText('Test message').parentElement!
    
    // First hover cycle: hover after 1 second, unhover after 1 second
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.mouseEnter(toastElement)
    act(() => {
      vi.advanceTimersByTime(1000) // Should not trigger removal
    })
    fireEvent.mouseLeave(toastElement)
    
    // Should have 2 seconds remaining
    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Advance through the exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('должен немедленно удалить уведомление, если duration равен 0 или отрицательный', () => {
    const toastZero = createToast({ duration: 0 })
    const toastNegative = createToast({ duration: -1000 })
    
    render(<ToastItem toast={toastZero} onRemove={mockOnRemove} />)
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Advance through the exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockOnRemove).toHaveBeenCalledWith(toastZero.id)
    
    mockOnRemove.mockClear()
    
    render(<ToastItem toast={toastNegative} onRemove={mockOnRemove} />)
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Advance through the exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockOnRemove).toHaveBeenCalledWith(toastNegative.id)
  })

  it('должен обрабатывать ручное удаление через кнопку закрытия', () => {
    const toast = createToast()
    
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    
    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)
    
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Advance through the exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('должен использовать duration по умолчанию, если она не указана', () => {
    const toast = createToast({ duration: undefined })
    
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    
    // Default duration is 3000ms
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(mockOnRemove).not.toHaveBeenCalled()
    
    // Advance through the exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('должен иметь анимацию появления при монтировании', () => {
    const toast = createToast()
    
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    
    const toastElement = screen.getByText('Test message').parentElement!
    
    // Initially should have exit class (isVisible is false)
    expect(toastElement).toHaveClass('toast-exit')
    expect(toastElement).not.toHaveClass('toast-enter')
    
    // After 10ms, should have enter class
    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(toastElement).toHaveClass('toast-enter')
    expect(toastElement).not.toHaveClass('toast-exit')
  })

  it('должен очищать таймаут при размонтировании', () => {
    const toast = createToast()
    const { unmount } = render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    
    // Wait for enter animation
    act(() => {
      vi.advanceTimersByTime(10)
    })
    
    // Unmount before timeout completes
    unmount()
    
    // Advance time beyond duration + exit animation
    act(() => {
      vi.advanceTimersByTime(3300)
    })
    
    // onRemove should not be called after unmount
    expect(mockOnRemove).not.toHaveBeenCalled()
  })
})
