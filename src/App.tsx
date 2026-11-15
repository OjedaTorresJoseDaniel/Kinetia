import { RouterProvider } from 'react-router'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { BusinessProvider } from './context/BusinessContext'
import { router } from './routes'

export default function App() {
  return (
    <BusinessProvider><ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </DataProvider>
    </ThemeProvider></BusinessProvider>
  )
}
