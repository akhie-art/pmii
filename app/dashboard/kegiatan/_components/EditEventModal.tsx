"use client";

import React from "react";
import EventFormModal from "./EventFormModal";
import type { FormField, EventActivity } from "./types";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventActivity | null | undefined;
  onSubmit: (eventData: {
    name: string;
    level: string;
    date: string;
    description?: string;
    sessions?: string[];
  }) => void;
  kaderisasiList: any[];
}

export default function EditEventModal({
  isOpen,
  onClose,
  event,
  onSubmit,
  kaderisasiList
}: EditEventModalProps) {
  return (
    <EventFormModal
      isOpen={isOpen}
      onClose={onClose}
      event={event}
      onSubmit={onSubmit}
      kaderisasiList={kaderisasiList}
    />
  );
}
