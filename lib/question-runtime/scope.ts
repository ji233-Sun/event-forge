'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import {
  IconPhoto,
  IconMusic,
  IconUpload,
  IconLoader2,
  IconX,
  IconPlus,
  IconCheck,
  IconStar,
  IconStarFilled,
  IconMicrophone,
  IconFile,
  IconPlayerPlay,
  IconPlayerPause,
} from '@tabler/icons-react'
import { useChat, useImageGen, useMusicGen, useFileUpload } from './hooks'

export const QUESTION_RUNTIME_SCOPE = {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Input,
  Textarea,
  Button,
  Label,
  Badge,
  Checkbox,
  Switch,
  Separator,
  Progress,
  Slider,
  IconPhoto,
  IconMusic,
  IconUpload,
  IconLoader2,
  IconX,
  IconPlus,
  IconCheck,
  IconStar,
  IconStarFilled,
  IconMicrophone,
  IconFile,
  IconPlayerPlay,
  IconPlayerPause,
  useChat,
  useImageGen,
  useMusicGen,
  useFileUpload,
} as const
