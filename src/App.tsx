import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LearningPage } from './pages/LearningPage'
import { AlphabetPage } from './pages/AlphabetPage'
import { LessonReviewPage } from './pages/LessonReviewPage'

export default function App(){return <Routes><Route path="/" element={<HomePage/>}/><Route path="/learn" element={<LearningPage/>}/><Route path="/alphabet" element={<AlphabetPage/>}/><Route path="/review/:sessionId" element={<LessonReviewPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
