import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute('/target/seven-letter')({
    component: SevenLetter,
})

export default function SevenLetter () {
    return <>Test</>
}