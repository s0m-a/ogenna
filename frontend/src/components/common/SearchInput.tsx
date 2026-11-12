'use client'

import { useRef } from 'react'
import styled from 'styled-components'
import { Search, X } from 'lucide-react'

const Wrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const IconLeft = styled.span`
  position: absolute;
  left: 0.625rem;
  display: flex;
  pointer-events: none;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Input = styled.input`
  height: 36px;
  width: 100%;
  padding: 0 2.25rem 0 2.125rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow   ${({ theme }) => theme.transitions.fast};

  &::placeholder { color: ${({ theme }) => theme.colors.textSecondary}; opacity: 0.7; }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const ClearBtn = styled.button`
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.borderStrong};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <Wrap className={className}>
      <IconLeft aria-hidden>
        <Search size={14} strokeWidth={2} />
      </IconLeft>
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <ClearBtn
          onClick={() => { onChange(''); ref.current?.focus() }}
          aria-label="Clear search"
        >
          <X size={10} strokeWidth={2.5} />
        </ClearBtn>
      )}
    </Wrap>
  )
}
