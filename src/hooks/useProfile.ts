import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchUserProfile,
  updateUserProfile,
  uploadAvatarFile,
  deleteAvatarFile,
  type UserProfile,
  type UpdateProfilePayload,
} from "@/lib/profiles";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["user_profile", user?.id];

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user) throw new Error("Pengguna belum login");
      return await fetchUserProfile(user);
    },
    staleTime: 1000 * 60 * 5, // 5 menit
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      if (!user) throw new Error("Pengguna belum login");
      return await updateUserProfile(user, payload);
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(queryKey, updatedData);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Pengguna belum login");
      return await uploadAvatarFile(user, file);
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async (currentAvatarUrl?: string | null) => {
      if (!user) throw new Error("Pengguna belum login");
      await deleteAvatarFile(user, currentAvatarUrl);
      return await updateUserProfile(user, {
        full_name: profile?.full_name || user.email?.split("@")[0] || "Pengguna",
        avatar_url: null,
      });
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(queryKey, updatedData);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    profile: profile ?? null,
    isLoading,
    error,
    refetch,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploading: uploadAvatarMutation.isPending,
    deleteAvatar: deleteAvatarMutation.mutateAsync,
    isDeletingAvatar: deleteAvatarMutation.isPending,
  };
}
