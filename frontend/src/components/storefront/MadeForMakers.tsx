'use client'

import styled from 'styled-components'

const BACKGROUND_IMAGE = '/images/fabricRolls.jpg'

const COPY = {
  heading: 'Made for makers, curated with care',
  body:
    'Born from a love of sewing and beautiful textiles, Ogenna was created to share the joy of making. We carefully choose natural fabrics with soft textures, earthy tones, and timeless prints — inspiring your next creation and celebrating the beauty of handmade.',
}



const Wrap = styled.section`
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  background-image: url(${BACKGROUND_IMAGE});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    background-attachment: scroll;
    min-height: 50vh;
  }
`

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(44, 31, 20, 0.35) 0%,
    rgba(44, 31, 20, 0.25) 60%,
    rgba(44, 31, 20, 0.35) 100%
  );
  pointer-events: none;
`

const Inner = styled.div`
  position: relative;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  padding: 5rem ${({ theme }) => theme.layout.pagePaddingX};
  text-align: center;
  color: ${({ theme }) => theme.colors.textInverse};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 3rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

const Heading = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textInverse};
  text-shadow: 0 2px 20px rgba(44, 31, 20, 0.35);
  margin-bottom: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
  }
`

const Body = styled.p`
  max-width: 820px;
  margin: 0 auto;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  color: ${({ theme }) => theme.colors.textInverse};
  text-shadow: 0 1px 8px rgba(44, 31, 20, 0.35);

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`

export function MadeForMakers() {
  return (
    <Wrap aria-label="Our mission">
      <Scrim aria-hidden />
      <Inner>
        <Heading>{COPY.heading}</Heading>
        <Body>{COPY.body}</Body>
      </Inner>
    </Wrap>
  )
}
