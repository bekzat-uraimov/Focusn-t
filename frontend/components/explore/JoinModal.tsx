"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  roomName: string;
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export default function JoinModal({ roomName, open, onClose, onJoin }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onJoin(code.trim().toUpperCase());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid invite code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setCode(""); setError(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join &ldquo;{roomName}&rdquo;</DialogTitle>
          <DialogDescription>Enter the invite code shared by the room host.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <Input
            placeholder="Invite code (e.g. AB3XY1)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="uppercase tracking-widest text-center font-mono"
            maxLength={8}
            required
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || code.length < 4}>
              {loading ? "Joining..." : "Join Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
