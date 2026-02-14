import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ToastItem } from './ToastItem'
import type { Toast } from '../types/types'

// Утилита для продвижения таймеров
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))

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

  it('должен отображаться при монтировании', () => {
    const toast = createToast()
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('вызывает onRemove после окончания duration и exit animation', () => {
    const toast = createToast()
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)

    tick(3000)        // duration
    vi.runAllTimers() // exit animation
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('приостанавливает таймер при hover и возобновляет после unhover', () => {
    const toast = createToast()
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    const toastEl = screen.getByText('Test message').parentElement!

    tick(1000)
    expect(mockOnRemove).not.toHaveBeenCalled()

    fireEvent.mouseEnter(toastEl)
    tick(3000)
    expect(mockOnRemove).not.toHaveBeenCalled()

    fireEvent.mouseLeave(toastEl)
    tick(2000)
    vi.runAllTimers()
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('поддерживает несколько циклов hover/unhover', () => {
    const toast = createToast()
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    const toastEl = screen.getByText('Test message').parentElement!

    tick(1000)
    fireEvent.mouseEnter(toastEl)
    tick(1000)
    fireEvent.mouseLeave(toastEl)

    tick(1999)
    expect(mockOnRemove).not.toHaveBeenCalled()
    tick(1)
    expect(mockOnRemove).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('немедленно удаляет toast с duration <= 0', () => {
    const toastZero = createToast({ duration: 0 })
    render(<ToastItem toast={toastZero} onRemove={mockOnRemove} />)
    vi.runAllTimers()
    expect(mockOnRemove).toHaveBeenCalledWith(toastZero.id)

    mockOnRemove.mockClear()

    const toastNegative = createToast({ duration: -1000 })
    render(<ToastItem toast={toastNegative} onRemove={mockOnRemove} />)
    vi.runAllTimers()
    expect(mockOnRemove).toHaveBeenCalledWith(toastNegative.id)
  })

  it('удаляет toast через кнопку закрытия', () => {
    const toast = createToast()
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)
    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)

    vi.runAllTimers()
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('использует default duration, если не указан', () => {
    const toast = createToast({ duration: undefined })
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />)

    tick(3000)
    vi.runAllTimers()
    expect(mockOnRemove).toHaveBeenCalledWith(toast.id)
  })

  it('очищает таймеры при размонтировании', () => {
    const toast = createToast()
    const { unmount } = render(<ToastItem toast={toast} onRemove={mockOnRemove} />)

    tick(10)
    unmount()
    vi.runAllTimers()
    expect(mockOnRemove).not.toHaveBeenCalled()
  })
})