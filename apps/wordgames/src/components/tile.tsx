interface Props {
  letter: string;
  onClick?: () => void;
  index: number;
  isCenter?: boolean;
}

export const Tile = (props: Props) => {
  return (
    <div
      onClick={props.onClick}
      key={props.index}
      className={`p-2 w-12 text-center drop-shadow-md active:drop-shadow-none m-2 ${
        props.isCenter ? 'bg-yellow-400 rounded-full' : 'bg-gray-100'
      }`}
    >
      {props.letter}
    </div>
  );
};
