import React from "react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ErrorPage() {
  const navigate = useNavigate();
  return (
    <div className="grow container p-4 mx-auto flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold">404 Not Found</h1>
      <p className="font-light text-lg tracking-wider text-center">
        The page you were looking for doesn't exist
      </p>
      <Button
        className="mt-4"
        onClick={() => {
          navigate(-1);
        }}
      >
        Go Back
      </Button>
    </div>
  );
}
