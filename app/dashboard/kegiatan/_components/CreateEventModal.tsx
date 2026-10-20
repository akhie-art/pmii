"use client";

import React from "react";
import EventFormModal from "./EventFormModal";
import type { FormField } from "./types";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: {
    name: string;
    level: string;
    date: string;
    description?: string;
    sessions?: string[];
    waGroupLink?: string;
    commissariat?: string;
    komisariat_id?: string | null;
    tenant_id?: string | null;
  }) => void;
  kaderisasiList: any[];
  currentUser?: any;
  commissariats?: any[];
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  kaderisasiList
}: CreateEventModalProps) {
  return (
    <EventFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      kaderisasiList={kaderisasiList}
    />
  );
}
