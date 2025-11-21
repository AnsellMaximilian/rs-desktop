import { Button } from "./components/ui/button";

export default function App() {
  return (
    <div className="">
      <h1 className="text-xl font-bold">Welcome</h1>
      <Button
        className=""
        onClick={async () => {
          const res = await api.files.pickFolder();
          console.log(res);
        }}
      >
        Choose Project Folder
      </Button>
    </div>
  );
}
