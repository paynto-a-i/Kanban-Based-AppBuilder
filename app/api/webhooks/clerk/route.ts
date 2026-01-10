import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new Response("Missing webhook secret", { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Get Supabase client
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.log("Supabase not configured, skipping sync");
    return new Response("OK", { status: 200 });
  }

  // Handle the webhook event
  const eventType = evt.type;

  try {
    // User events
    if (eventType === "user.created" || eventType === "user.updated") {
      await handleUserUpsert(supabase, evt.data);
      console.log(`User ${eventType}: ${evt.data.id}`);
    }

    if (eventType === "user.deleted") {
      await handleUserDelete(supabase, evt.data.id);
      console.log(`User deleted: ${evt.data.id}`);
    }

    // Organization events
    if (eventType === "organization.created" || eventType === "organization.updated") {
      await handleOrganizationUpsert(supabase, evt.data as any);
      console.log(`Organization ${eventType}: ${(evt.data as any).id}`);
    }

    if (eventType === "organization.deleted") {
      await handleOrganizationDelete(supabase, (evt.data as any).id);
      console.log(`Organization deleted: ${(evt.data as any).id}`);
    }

    // Organization membership events
    if (eventType === "organizationMembership.created" || eventType === "organizationMembership.updated") {
      await handleMembershipUpsert(supabase, evt.data as any);
      console.log(`Membership ${eventType}: ${(evt.data as any).id}`);
    }

    if (eventType === "organizationMembership.deleted") {
      await handleMembershipDelete(supabase, evt.data as any);
      console.log(`Membership deleted: ${(evt.data as any).id}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`Error handling ${eventType}:`, error);
    return new Response("Database error", { status: 500 });
  }
}

// User handlers
async function handleUserUpsert(supabase: SupabaseClient, data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data;
  const email = email_addresses?.[0]?.email_address;
  const name = [first_name, last_name].filter(Boolean).join(" ") || null;

  const { error } = await supabase.from("users").upsert(
    {
      id,
      email,
      name,
      image: image_url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(`Error syncing user: ${error.message}`);
  }
}

async function handleUserDelete(supabase: SupabaseClient, userId: string | undefined) {
  if (!userId) return;

  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
}

// Organization handlers
async function handleOrganizationUpsert(supabase: SupabaseClient, data: any) {
  const { id, name, slug, image_url } = data;

  const { error } = await supabase.from("organizations").upsert(
    {
      id,
      name,
      slug,
      image_url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    // Table might not exist yet, log and continue
    console.warn(`Error syncing organization (table may not exist): ${error.message}`);
  }
}

async function handleOrganizationDelete(supabase: SupabaseClient, orgId: string | undefined) {
  if (!orgId) return;

  // Delete all memberships first
  await supabase.from("organization_memberships").delete().eq("org_id", orgId);

  // Then delete the organization
  const { error } = await supabase.from("organizations").delete().eq("id", orgId);
  if (error) {
    console.warn(`Error deleting organization (table may not exist): ${error.message}`);
  }
}

// Membership handlers
async function handleMembershipUpsert(supabase: SupabaseClient, data: any) {
  const { id, organization, public_user_data, role } = data;
  const orgId = organization?.id;
  const userId = public_user_data?.user_id;

  if (!orgId || !userId) {
    console.warn("Missing org_id or user_id in membership data");
    return;
  }

  const { error } = await supabase.from("organization_memberships").upsert(
    {
      id,
      org_id: orgId,
      user_id: userId,
      role: role || "member",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    // Table might not exist yet, log and continue
    console.warn(`Error syncing membership (table may not exist): ${error.message}`);
  }
}

async function handleMembershipDelete(supabase: SupabaseClient, data: any) {
  const { organization, public_user_data } = data;
  const orgId = organization?.id;
  const userId = public_user_data?.user_id;

  if (!orgId || !userId) return;

  const { error } = await supabase
    .from("organization_memberships")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (error) {
    console.warn(`Error deleting membership (table may not exist): ${error.message}`);
  }
}
