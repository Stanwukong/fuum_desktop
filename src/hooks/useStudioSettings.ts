import { updateStudioSettingsSchema } from "@/schemas/studio-settings.schema";
import { useZodForm } from "./useZodForm";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateStudioSettings } from "@/lib/utils";
import { toast } from "sonner";

export const useStudioSettings = (
  id: string,
  screen?: string | null,
  audio?: string | null,
  preset?: "HD" | "SD",
  plan?: "PRO" | "FREE"
) => {
  const [onPreset, setPreset] = useState<"HD" | "SD" | undefined>();

  const { register, watch } = useZodForm(updateStudioSettingsSchema, {
    screen: screen!,
    audio: audio!,
    preset: preset!,
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["update-studio"],
    mutationFn: async (data: {
      screen: string;
      audio: string;
      preset: "HD" | "SD";
      id: string;
    }) => updateStudioSettings(data.id, data.screen, data.audio, data.preset),
    onSuccess: (data) => {
      return toast(data.status === 200 ? "Success" : "Error", {
        description: data.message,
      });
    },
  });

  useEffect(() => {
    if (screen && audio) {
      window.ipcRenderer.send("media-sources", {
        screen,
        audio,
        id: id,
        preset,
        plan,
      });
    }
  }, [screen, audio]);

  useEffect(() => {
    const subscribe = watch((values) => {
      setPreset(values.preset);
      mutate({
        screen: values.screen!,
        audio: values.audio!,
        id,
        preset: values.preset!,
      });
      window.ipcRenderer.send("media-sources", {
        screen: values.screen,
        audio: values.audio,
        id,
        preset: values.preset,
        plan,
      });
    });

    return () => subscribe.unsubscribe();
  }, [watch]);

  return { register, isPending, onPreset };
};
