interface Props {
    letter: string;
    onClick?: () => void;
    index: number;
}

export const Tile = (props: Props) => {
    return <div onClick={props.onClick} key={props.index} className={"bg-gray-100 p-2 w-12 text-center drop-shadow-md active:drop-shadow-none m-2"}>
        {props.letter}
    </div>
}