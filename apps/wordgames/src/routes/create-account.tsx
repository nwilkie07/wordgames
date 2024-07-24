import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import {  createUserWithEmailAndPassword  } from 'firebase/auth';



export const Route = createFileRoute('/create-account')({
  component: CreateAccount
})

export default function CreateAccount() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault()

    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log(user);
        navigate("/login")
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        // ..
      });
  }

  return (
    <div className={"flex flex-1 flex-col justify-center h-lvh"}>
      <div className={"m-auto"}>
        <div className={'grid grid-cols-2 gap-4 p-4 bg-gray-200 rounded-lg'}>
          <span>Username</span>
          <input className={'border-solid border-2'} />
          <span>Email</span>
          <input className={'border-solid border-2'} />
          <span>Password</span>
          <input className={'border-solid border-2'} />
        </div>
        <div className={'flex flex-1 gap-4 justify-end p-4'}>
          <button>Submit</button>
        </div>
      </div>
    </div>
  )
}
