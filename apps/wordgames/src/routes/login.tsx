import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: Login
})

export default function Login(){

return (
  <div className={"flex flex-1 flex-col justify-center h-lvh"}>
    <div className={"m-auto"}>
    <div className={"grid grid-cols-2 gap-4 p-4 bg-gray-200 rounded-lg"}>
      <span>Email</span>
      <input className={"border-solid border-2"} />
      <span>Password</span>
      <input className={"border-solid border-2"} />
    </div>
      <div className={"flex flex-1 gap-4 justify-between p-4"}>
        <button>Create account</button>
        <button className={""}>Login</button>
      </div>
    </div>
  </div>)
}
