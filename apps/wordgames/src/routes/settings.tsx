import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
    component: Settings
});

export default function Settings() {
    return <>Test</>;
}
