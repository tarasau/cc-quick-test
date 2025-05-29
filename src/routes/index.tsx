import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";

export default function Home() {
  const navigate = useNavigate();

  onMount(() => {
    navigate('/login');
  });

  return null;
}
