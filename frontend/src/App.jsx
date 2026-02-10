import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Bitacora from './pages/Bitacora'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/bitacora" element={<Bitacora />} />
      <Route path="/admin/*" element={<Admin />} />
    </Routes>
  )
}
