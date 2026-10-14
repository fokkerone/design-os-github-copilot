import { createContext, useContext } from 'react'

/** True for pages rendered inside the app shell; they skip their own header and page chrome */
export const InShellContext = createContext(false)
export const useInShell = () => useContext(InShellContext)
