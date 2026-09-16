import React from 'react'
import { useInView } from '../../hooks/useInView'

interface BaseMotionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  delay?: number // in ms
  duration?: number // in ms
  className?: string
  once?: boolean
  as?: React.ElementType
}

/**
 * FadeUp primitive
 * Animates opacity (0 -> 1) and translateY (25px -> 0px)
 */
export function FadeUp({
  children,
  delay = 0,
  duration = 600,
  className = '',
  once = true,
  as: Component = 'div',
  style,
  ...props
}: BaseMotionProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ triggerOnce: once })

  const motionStyle: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(25px)',
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
    willChange: 'opacity, transform',
    ...style,
  }

  return (
    <Component ref={ref} style={motionStyle} className={className} {...props}>
      {children}
    </Component>
  )
}

/**
 * FadeIn primitive
 * Animates opacity (0 -> 1)
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  className = '',
  once = true,
  as: Component = 'div',
  style,
  ...props
}: BaseMotionProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ triggerOnce: once })

  const motionStyle: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transitionProperty: 'opacity',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
    willChange: 'opacity',
    ...style,
  }

  return (
    <Component ref={ref} style={motionStyle} className={className} {...props}>
      {children}
    </Component>
  )
}

/**
 * Context to automatically calculate stagger delays for child items
 */
const StaggerContext = React.createContext<{ inView: boolean; interval: number }>({
  inView: false,
  interval: 70,
})

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  interval?: number // in ms, default 70ms
  className?: string
  once?: boolean
}

export function StaggerContainer({
  children,
  interval = 70,
  className = '',
  once = true,
  style,
  ...props
}: StaggerContainerProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ triggerOnce: once })

  return (
    <StaggerContext.Provider value={{ inView, interval }}>
      <div ref={ref} className={className} style={style} {...props}>
        {children}
      </div>
    </StaggerContext.Provider>
  )
}

interface StaggerItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  index: number
  className?: string
  duration?: number
}

export function StaggerItem({
  children,
  index,
  className = '',
  duration = 500,
  style,
  ...props
}: StaggerItemProps) {
  const { inView, interval } = React.useContext(StaggerContext)
  const delay = index * interval

  const itemStyle: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(20px)',
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
    willChange: 'opacity, transform',
    ...style,
  }

  return (
    <div style={itemStyle} className={className} {...props}>
      {children}
    </div>
  )
}

/**
 * ImageReveal primitive
 * Uses a mask/clip reveal (cream overlay sliding open) with image scale 1.05 -> 1.00
 */
interface ImageRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string
  alt: string
  aspectRatio?: string
  className?: string
  imgClassName?: string
}

export function ImageReveal({
  src,
  alt,
  aspectRatio = 'aspect-4/3',
  className = '',
  imgClassName = '',
  ...props
}: ImageRevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ triggerOnce: true })

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl bg-(--bg-surface-secondary) ${aspectRatio} ${className}`}
      {...props}
    >
      {/* Image with subtle scale transition */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          inView ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
        } ${imgClassName}`}
        loading="lazy"
      />

      {/* Cream Reveal Curtain Mask */}
      <div
        className="absolute inset-0 bg-(--bg-primary) pointer-events-none transition-transform duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] origin-right"
        style={{
          transform: inView ? 'scaleX(0)' : 'scaleX(1)',
        }}
      />
    </div>
  )
}

/**
 * SlideReveal primitive
 * Horizontal or vertical directional reveal
 */
interface SlideRevealProps extends BaseMotionProps {
  direction?: 'left' | 'right' | 'up' | 'down'
  distance?: number
}

export function SlideReveal({
  children,
  direction = 'left',
  distance = 30,
  delay = 0,
  duration = 600,
  className = '',
  once = true,
  style,
  ...props
}: SlideRevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ triggerOnce: once })

  const getInitialTransform = () => {
    switch (direction) {
      case 'left':
        return `translateX(-${distance}px)`
      case 'right':
        return `translateX(${distance}px)`
      case 'up':
        return `translateY(${distance}px)`
      case 'down':
        return `translateY(-${distance}px)`
    }
  }

  const motionStyle: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translate(0, 0)' : getInitialTransform(),
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
    willChange: 'opacity, transform',
    ...style,
  }

  return (
    <div ref={ref} style={motionStyle} className={className} {...props}>
      {children}
    </div>
  )
}
