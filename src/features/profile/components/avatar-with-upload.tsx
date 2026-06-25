"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadIcon, X } from "lucide-react";
import { toast } from "sonner";
import { uploadUserImageAction } from "@/features/upload/actions/upload.action";
import { useMutation } from "@tanstack/react-query";
import { resetImageUserAction, updateImageUserAction } from "@/features/profile/actions/avatar.action";
import { useRouter } from "next/navigation";
import { User } from "@/db/schema/02_user";
import React, { ChangeEvent } from "react";

export type AvatarWithUploadProps = {
  user: User;
  avatarUrl?: string;
};

export const AvatarWithUpload = (props: AvatarWithUploadProps) => {
  const user = props.user;
  const hasCustomImage = !!user.image;
  const src = props.avatarUrl ?? user.image ?? undefined;
  const router = useRouter();

  const submitImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadUserImageAction(formData);

      const inner = result?.data;

      if (inner?.success) {
        const updateUser = await updateImageUserAction(inner.value ?? "");
        const dataUser = updateUser?.data;

        if (updateUser?.serverError || !dataUser) {
          toast.error(updateUser?.serverError);
          return;
        }

        toast.success(inner.actionSuccess?.message);
        router.refresh();
      } else {
        toast.error(inner?.actionError?.message);
      }
    },
  });

  const resetImage = useMutation({
    mutationFn: async () => {
      const result = await resetImageUserAction();
      if (result?.serverError) throw new Error(result.serverError);
      toast.success("Avatar reset");
      router.refresh();
    },
    onError: () => toast.error("Failed to reset avatar"),
  });

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedFormats = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedFormats.includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed.");
      return;
    }

    const maxSizeInMB = 5;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${maxSizeInMB}MB.`);
      return;
    }

    submitImage.mutate(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar
          key={src}
          className="w-24 h-24 lg:w-32 lg:h-32 border-4 border-muted/20"
        >
          {src && <AvatarImage className="object-cover" src={src} />}
          <AvatarFallback className="text-3xl">
            {(user.name?.charAt(0) ?? user.email?.charAt(0) ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div
          onClick={() => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = ".jpg,.jpeg,.png,.webp";
            fileInput.onchange = (e: Event) =>
              handleImageUpload(
                e as unknown as React.ChangeEvent<HTMLInputElement>,
              );
            fileInput.click();
          }}
          className="cursor-pointer absolute inset-0 flex justify-center items-center opacity-0 transition-opacity hover:opacity-30 hover:bg-gray-500 hover:bg-opacity-50 rounded-full w-24 h-24 lg:w-32 lg:h-32"
        >
          <UploadIcon className="w-12 h-12 lg:w-16 lg:h-16 text-primary" />
        </div>
      </div>

      {hasCustomImage && (
        <button
          type="button"
          onClick={() => resetImage.mutate()}
          disabled={resetImage.isPending}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <X className="size-3" />
          Reset avatar
        </button>
      )}
    </div>
  );
};
