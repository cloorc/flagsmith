import json

# Load import data for 1:1 imports edges
with open(".understand-anything/tmp/ua-file-analyzer-input-1.json") as f:
    inp = json.load(f)
import_data = inp["batchImportData"]

nodes = []
edges = []

def add_node(node):
    nodes.append(node)

def add_edge(source, target, type_, weight, direction="forward"):
    if source == target:
        return
    edges.append({"source": source, "target": target, "type": type_, "direction": direction, "weight": weight})

# ---- FILE NODES ----
file_nodes = [
    ("api_keys/admin.py", "admin.py", "Registers the MasterAPIKey model in the Django admin site.", ["admin", "django", "configuration"], "simple"),
    ("api_keys/authentication.py", "authentication.py", "DRF authentication backend that resolves a master API key from the request and yields an APIKeyUser.", ["authentication", "api-handler", "security"], "simple"),
    ("api_keys/models.py", "models.py", "Defines the MasterAPIKey model and manager for organisation-scoped master API keys, including role cleanup on delete.", ["data-model", "django", "api-keys"], "simple"),
    ("api_keys/serializers.py", "serializers.py", "Serialiser for creating and representing master API keys, returning the plaintext key once on creation.", ["serialization", "api-keys", "validation"], "simple"),
    ("api_keys/user.py", "user.py", "Pseudo-user object representing a master API key, exposing permission-check methods mirroring the authenticated user interface.", ["authentication", "permissions", "api-keys", "security"], "moderate"),
    ("api_keys/views.py", "views.py", "DRF viewset for listing and creating organisation-scoped master API keys.", ["api-handler", "api-keys", "viewset"], "simple"),
    ("audit/permissions.py", "permissions.py", "DRF permission classes gating access to organisation- and project-scoped audit logs.", ["permissions", "security", "audit"], "simple"),
    ("audit/urls.py", "urls.py", "URL routing for the global audit log endpoint.", ["routing", "urls", "audit"], "simple"),
    ("audit/views.py", "views.py", "Audit-log viewsets providing organisation, project, and global scopes with subscription-based visibility limits.", ["api-handler", "audit", "viewset"], "moderate"),
    ("features/versioning/constants.py", "constants.py", "Constant definitions for the feature versioning subsystem.", ["constants", "feature-versioning", "configuration"], "simple"),
    ("organisations/__init__.py", "__init__.py", "Package marker for the organisations Django app.", ["entry-point", "package", "django"], "simple"),
    ("organisations/chargebee/__init__.py", "__init__.py", "Chargebee package barrel re-exporting billing helper functions from the chargebee module.", ["entry-point", "barrel", "billing"], "simple"),
    ("organisations/chargebee/cache.py", "cache.py", "Caches Chargebee plan and addon metadata in Django cache, refreshing from the Chargebee API on miss.", ["service", "caching", "billing"], "moderate"),
    ("organisations/chargebee/chargebee.py", "chargebee.py", "Chargebee integration layer wrapping the Chargebee client for subscriptions, hosted pages, seat and API-call upgrades, and metadata extraction.", ["service", "billing", "integration", "third-party"], "complex"),
    ("organisations/chargebee/client.py", "client.py", "Initialises and configures the global Chargebee SDK client from settings.", ["configuration", "billing", "third-party"], "simple"),
    ("organisations/chargebee/constants.py", "constants.py", "Constants for the Chargebee integration such as cache keys and timeouts.", ["constants", "billing", "configuration"], "simple"),
    ("organisations/chargebee/metadata.py", "metadata.py", "Dataclasses describing Chargebee object metadata and items used to compute subscription limits.", ["data-model", "billing", "type-definition"], "simple"),
    ("organisations/chargebee/serializers.py", "serializers.py", "Serialisers validating Chargebee webhook payloads for payment and subscription events.", ["serialization", "billing", "validation"], "moderate"),
    ("organisations/chargebee/tasks.py", "tasks.py", "Async task refreshing the Chargebee plan and addon metadata cache.", ["service", "async-task", "billing"], "simple"),
    ("organisations/chargebee/webhook_event_types.py", "webhook_event_types.py", "Enumeration of Chargebee webhook event type identifiers.", ["constants", "billing", "webhook"], "simple"),
    ("organisations/chargebee/webhook_handlers.py", "webhook_handlers.py", "Handlers for incoming Chargebee webhooks driving cache rebuilds and subscription state changes on payment events.", ["api-handler", "billing", "webhook", "event-handler"], "moderate"),
    ("organisations/constants.py", "constants.py", "App-wide constants for the organisations app such as alert thresholds.", ["constants", "configuration", "organisations"], "simple"),
    ("organisations/exceptions.py", "exceptions.py", "Domain exceptions for the organisations app, such as missing paid subscription.", ["exceptions", "error-handling", "organisations"], "simple"),
    ("organisations/invites/admin.py", "admin.py", "Registers the Invite model in the Django admin with custom display fields.", ["admin", "django", "configuration"], "simple"),
    ("organisations/invites/exceptions.py", "exceptions.py", "Domain exceptions for invites covering expired invites and disabled invite links.", ["exceptions", "error-handling", "invites"], "simple"),
    ("organisations/invites/models.py", "models.py", "Models for organisation invites and invite links, including expiry checks and invitation email delivery.", ["data-model", "django", "invites", "email"], "moderate"),
    ("organisations/invites/serializers.py", "serializers.py", "Serialisers for representing invite links and listing organisation invites.", ["serialization", "invites"], "simple"),
    ("organisations/invites/views.py", "views.py", "Viewsets and function views for managing invites and invite links, including join-by-email/link flows and seat-limit enforcement.", ["api-handler", "invites", "viewset"], "moderate"),
    ("organisations/management/commands/check_if_organisations_over_plan_limit.py", "check_if_organisations_over_plan_limit.py", "Management command that flags organisations exceeding their plan seat limit and dispatches alert tasks.", ["management-command", "organisations", "script"], "simple"),
    ("organisations/management/commands/createinitialorganisation.py", "createinitialorganisation.py", "Management command bootstrapping an initial organisation and attaching the initial superuser.", ["management-command", "organisations", "bootstrap", "script"], "simple"),
    ("organisations/managers.py", "managers.py", "Custom model manager scoping organisation permission querysets.", ["data-model", "manager", "organisations"], "simple"),
    ("organisations/models.py", "models.py", "Core organisations domain models: Organisation, Subscription, user membership, subscription caches, billing, and API-usage tracking with extensive billing and plan-limit logic.", ["data-model", "django", "organisations", "billing", "subscription"], "complex"),
]

for path, name, summary, tags, complexity in file_nodes:
    node = {
        "id": f"file:{path}",
        "type": "file",
        "name": name,
        "filePath": path,
        "summary": summary,
        "tags": tags,
        "complexity": complexity,
    }
    add_node(node)

# Add languageNotes to a few notable ones
for n in nodes:
    if n["id"] == "file:organisations/models.py":
        n["languageNotes"] = "Heavy use of Django @property accessors and cached_property; multiple subscription-metadata strategy methods dispatch on SaaS vs self-hosted deployment."
    if n["id"] == "file:organisations/chargebee/chargebee.py":
        n["languageNotes"] = "Module-level functional API wrapping the Chargebee SDK; uses contextlib.suppress and explicit exception translation to domain errors."

# ---- IMPORTS EDGES (1:1) ----
for src, targets in import_data.items():
    for tgt in targets:
        add_edge(f"file:{src}", f"file:{tgt}", "imports", 0.7)

# ---- FUNCTION / CLASS NODES (significance filter) + contains/exports ----
# helper
def fn_node(path, name, lr, summary, tags, complexity, exported=True):
    add_node({
        "id": f"function:{path}:{name}",
        "type": "function",
        "name": name,
        "filePath": path,
        "lineRange": lr,
        "summary": summary,
        "tags": tags,
        "complexity": complexity,
    })
    add_edge(f"file:{path}", f"function:{path}:{name}", "contains", 1.0)
    if exported:
        add_edge(f"file:{path}", f"function:{path}:{name}", "exports", 0.8)

def cls_node(path, name, lr, summary, tags, complexity, exported=True):
    add_node({
        "id": f"class:{path}:{name}",
        "type": "class",
        "name": name,
        "filePath": path,
        "lineRange": lr,
        "summary": summary,
        "tags": tags,
        "complexity": complexity,
    })
    add_edge(f"file:{path}", f"class:{path}:{name}", "contains", 1.0)
    if exported:
        add_edge(f"file:{path}", f"class:{path}:{name}", "exports", 0.8)

# api_keys/authentication.py
cls_node("api_keys/authentication.py", "MasterAPIKeyAuthentication", [12, 23],
         "DRF authentication class that parses a master API key and returns an APIKeyUser, raising AuthenticationFailed when invalid.",
         ["authentication", "security", "api-keys"], "simple")

# api_keys/models.py
cls_node("api_keys/models.py", "MasterAPIKey", [21, 44],
         "Organisation-scoped master API key model that cascades deletion of associated role links.",
         ["data-model", "api-keys", "django"], "simple")

# api_keys/serializers.py
cls_node("api_keys/serializers.py", "MasterAPIKeySerializer", [7, 41],
         "Serialiser that creates master API keys via the manager and validates the is_admin flag.",
         ["serialization", "api-keys", "validation"], "simple")

# api_keys/user.py
cls_node("api_keys/user.py", "APIKeyUser", [22, 118],
         "Authenticated-user stand-in for a master API key, delegating organisation/project/environment permission checks to the permission service.",
         ["authentication", "permissions", "api-keys", "security"], "moderate")

# api_keys/views.py
cls_node("api_keys/views.py", "MasterAPIKeyViewSet", [14, 37],
         "Viewset that filters master API keys to the current organisation and assigns ownership on creation.",
         ["api-handler", "api-keys", "viewset"], "simple")

# audit/permissions.py
cls_node("audit/permissions.py", "OrganisationAuditLogPermissions", [10, 18],
         "Permission class allowing organisation admins to read the organisation audit log.",
         ["permissions", "security", "audit"], "simple")
cls_node("audit/permissions.py", "ProjectAuditLogPermissions", [21, 29],
         "Permission class gating project audit log access on project-level permission.",
         ["permissions", "security", "audit"], "simple")

# audit/views.py
cls_node("audit/views.py", "_BaseAuditLogViewSet", [29, 90],
         "Base audit-log viewset building filters, choosing serialisers, and applying subscription-tier visibility limits.",
         ["api-handler", "audit", "viewset", "abstract"], "moderate")
cls_node("audit/views.py", "AllAuditLogViewSet", [93, 117],
         "Audit-log viewset returning entries across all organisations the requesting admin belongs to.",
         ["api-handler", "audit", "viewset"], "simple")
cls_node("audit/views.py", "OrganisationAuditLogViewSet", [120, 133],
         "Audit-log viewset scoped to a single organisation.",
         ["api-handler", "audit", "viewset"], "simple")
cls_node("audit/views.py", "ProjectAuditLogViewSet", [136, 149],
         "Audit-log viewset scoped to a single project.",
         ["api-handler", "audit", "viewset"], "simple")

# chargebee/cache.py
cls_node("organisations/chargebee/cache.py", "ChargebeeCache", [12, 49],
         "Lazy cache of Chargebee plan and addon metadata backed by Django cache, refreshing from the API on miss.",
         ["service", "caching", "billing"], "moderate")
fn_node("organisations/chargebee/cache.py", "get_item_generator", [52, 65],
        "Generator yielding paginated Chargebee items for a given resource type from the Chargebee API.",
        ["billing", "third-party", "generator"], "simple")

# chargebee/chargebee.py — significant functions (10+ lines or exported & non-trivial)
cb = "organisations/chargebee/chargebee.py"
fn_node(cb, "get_subscription_data_from_hosted_page", [60, 76],
        "Builds a subscription-data dict from a Chargebee hosted page, combining plan metadata, seats, and API-call limits.",
        ["billing", "third-party", "subscription"], "simple")
fn_node(cb, "get_portal_url", [123, 134],
        "Creates a Chargebee customer portal session and returns its access URL.",
        ["billing", "third-party"], "simple")
fn_node(cb, "get_hosted_page_url_for_subscription_upgrade", [144, 155],
        "Generates a Chargebee checkout hosted-page URL for upgrading an existing subscription's plan.",
        ["billing", "third-party", "subscription"], "simple")
fn_node(cb, "extract_subscription_metadata", [158, 176],
        "Computes aggregated subscription metadata (seats, API calls, projects) from a Chargebee subscription and its addons.",
        ["billing", "subscription", "serialization"], "simple")
fn_node(cb, "get_subscription_metadata_from_id", [179, 197],
        "Retrieves a Chargebee subscription by id and extracts its subscription metadata, tolerating errors.",
        ["billing", "subscription", "third-party"], "simple")
fn_node(cb, "cancel_subscription", [200, 209],
        "Cancels a Chargebee subscription, raising a domain error on failure.",
        ["billing", "subscription", "third-party"], "simple")
fn_node(cb, "add_single_seat", [212, 263],
        "Adds one seat to a Chargebee subscription via addon update, translating payment failures into domain errors.",
        ["billing", "subscription", "third-party", "error-handling"], "moderate")
fn_node(cb, "add_100k_api_calls", [291, 329],
        "Adds API-call capacity to a Chargebee subscription via an addon, handling payment failure and error cases.",
        ["billing", "subscription", "third-party", "error-handling"], "moderate")

# chargebee/metadata.py
cls_node("organisations/chargebee/metadata.py", "ChargebeeObjMetadata", [7, 16],
         "Dataclass aggregating Chargebee object limits with scalar multiplication for quantity-based scaling.",
         ["data-model", "billing", "type-definition"], "simple")

# chargebee/serializers.py — top-level webhook serializers (representative significant ones)
cls_node("organisations/chargebee/serializers.py", "PaymentFailedSerializer", [64, 65],
         "Top-level serialiser validating Chargebee payment-failed webhook payloads.",
         ["serialization", "billing", "webhook"], "simple")
cls_node("organisations/chargebee/serializers.py", "PaymentSucceededSerializer", [68, 69],
         "Top-level serialiser validating Chargebee payment-succeeded webhook payloads.",
         ["serialization", "billing", "webhook"], "simple")
cls_node("organisations/chargebee/serializers.py", "ProcessSubscriptionSerializer", [48, 49],
         "Top-level serialiser validating Chargebee subscription-change webhook payloads.",
         ["serialization", "billing", "webhook"], "simple")

# chargebee/tasks.py
fn_node("organisations/chargebee/tasks.py", "update_chargebee_cache", [9, 11],
        "Registered async task that refreshes the Chargebee plan and addon metadata cache.",
        ["async-task", "billing", "caching"], "simple")

# chargebee/webhook_handlers.py
wh = "organisations/chargebee/webhook_handlers.py"
fn_node(wh, "payment_failed", [37, 69],
        "Webhook handler marking a subscription's payment status as failed when dunning begins.",
        ["api-handler", "billing", "webhook", "event-handler"], "moderate")
fn_node(wh, "payment_succeeded", [72, 104],
        "Webhook handler restoring a subscription's payment status to active on successful payment.",
        ["api-handler", "billing", "webhook", "event-handler"], "moderate")
fn_node(wh, "process_subscription", [107, 187],
        "Webhook handler reconciling subscription state — cancellation, plan changes, and refreshing the subscription information cache.",
        ["api-handler", "billing", "webhook", "event-handler"], "moderate")

# invites/admin.py
cls_node("organisations/invites/admin.py", "InviteAdmin", [7, 28],
         "Django admin configuration for the Invite model with custom list display.",
         ["admin", "django", "invites"], "simple")

# invites/models.py
cls_node("organisations/invites/models.py", "InviteLink", [35, 54],
         "Reusable invite-link model with expiry checks and invite-links-enabled validation.",
         ["data-model", "invites", "django"], "simple")
cls_node("organisations/invites/models.py", "Invite", [57, 111],
         "Single-recipient organisation invite model that renders and sends the invitation email.",
         ["data-model", "invites", "email", "django"], "moderate")

# invites/serializers.py
cls_node("organisations/invites/serializers.py", "InviteListSerializer", [14, 19],
         "Serialiser listing organisation invites with inviter details.",
         ["serialization", "invites"], "simple")

# invites/views.py
fn_node("organisations/invites/views.py", "join_organisation_from_email", [41, 55],
        "Function view letting an authenticated user accept an email invite and join the organisation.",
        ["api-handler", "invites", "event-handler"], "simple")
fn_node("organisations/invites/views.py", "join_organisation_from_link", [59, 75],
        "Function view letting an authenticated user join an organisation via an invite link, enforcing expiry.",
        ["api-handler", "invites", "event-handler"], "simple")
cls_node("organisations/invites/views.py", "InviteLinkViewSet", [78, 108],
         "Viewset managing organisation invite links with seat-limit enforcement on access.",
         ["api-handler", "invites", "viewset"], "moderate")
cls_node("organisations/invites/views.py", "InviteViewSet", [123, 178],
         "Viewset managing organisation invites, including resend action and seat-upgrade checks on creation.",
         ["api-handler", "invites", "viewset"], "moderate")

# management commands
cls_node("organisations/management/commands/check_if_organisations_over_plan_limit.py", "Command", [7, 13],
         "Management command iterating organisations and dispatching over-limit alerts for those exceeding seat limits.",
         ["management-command", "organisations", "script"], "simple")
cls_node("organisations/management/commands/createinitialorganisation.py", "Command", [14, 48],
         "Management command that creates an initial organisation and attaches the initial superuser if none exists.",
         ["management-command", "organisations", "bootstrap", "script"], "simple")

# managers.py
cls_node("organisations/managers.py", "OrganisationPermissionManager", [6, 8],
         "Manager that scopes queries to organisation-permission rows.",
         ["data-model", "manager", "organisations"], "simple")

# organisations/models.py — significant models
om = "organisations/models.py"
cls_node(om, "Organisation", [67, 204],
         "Central organisation model owning subscriptions, seats, and environments, with plan-limit, billing, and cache-management logic.",
         ["data-model", "organisations", "django", "billing"], "complex")
cls_node(om, "UserOrganisation", [207, 228],
         "Through model linking users to organisations with a role, triggering Hubspot lead tracking.",
         ["data-model", "organisations", "django"], "simple")
cls_node(om, "Subscription", [231, 468],
         "Organisation subscription model encapsulating plan management, seat upgrades, cancellation, and deployment-specific subscription metadata resolution.",
         ["data-model", "organisations", "subscription", "billing"], "complex")
cls_node(om, "OrganisationSubscriptionInformationCache", [484, 580],
         "Cache model storing subscription limits and usage, exposing helpers to materialise base/Chargebee subscription metadata.",
         ["data-model", "organisations", "subscription", "caching"], "moderate")
cls_node(om, "OrganisationAPIBilling", [625, 651],
         "Model recording organisation API-overage billing line items.",
         ["data-model", "organisations", "billing"], "simple")

# ---- SEMANTIC calls / depends_on edges (cross-file, high-confidence from call graph + imports) ----
# api_keys
add_edge("file:api_keys/authentication.py", "class:api_keys/user.py:APIKeyUser", "calls", 0.8)
add_edge("file:api_keys/serializers.py", "class:api_keys/models.py:MasterAPIKey", "calls", 0.8)

# chargebee internal calls
add_edge("function:organisations/chargebee/cache.py:get_item_generator", "class:organisations/chargebee/metadata.py:ChargebeeObjMetadata", "calls", 0.8)
add_edge("class:organisations/chargebee/cache.py:ChargebeeCache", "function:organisations/chargebee/cache.py:get_item_generator", "calls", 0.8)
add_edge("function:organisations/chargebee/chargebee.py:extract_subscription_metadata", "class:organisations/chargebee/cache.py:ChargebeeCache", "calls", 0.8)
add_edge("function:organisations/chargebee/chargebee.py:extract_subscription_metadata", "class:organisations/chargebee/metadata.py:ChargebeeObjMetadata", "calls", 0.8)
add_edge("function:organisations/chargebee/chargebee.py:get_subscription_metadata_from_id", "function:organisations/chargebee/chargebee.py:extract_subscription_metadata", "calls", 0.8)
add_edge("function:organisations/chargebee/tasks.py:update_chargebee_cache", "class:organisations/chargebee/cache.py:ChargebeeCache", "calls", 0.8)

# webhook handlers call into chargebee + tasks + models
add_edge("function:organisations/chargebee/webhook_handlers.py:process_subscription", "function:organisations/chargebee/chargebee.py:extract_subscription_metadata", "calls", 0.8)
add_edge("function:organisations/chargebee/webhook_handlers.py:payment_failed", "class:organisations/chargebee/serializers.py:PaymentFailedSerializer", "calls", 0.8)
add_edge("function:organisations/chargebee/webhook_handlers.py:payment_succeeded", "class:organisations/chargebee/serializers.py:PaymentSucceededSerializer", "calls", 0.8)
add_edge("function:organisations/chargebee/webhook_handlers.py:process_subscription", "class:organisations/chargebee/serializers.py:ProcessSubscriptionSerializer", "calls", 0.8)
add_edge("function:organisations/chargebee/webhook_handlers.py:process_subscription", "class:organisations/models.py:OrganisationSubscriptionInformationCache", "calls", 0.8)

# organisations/models Subscription uses chargebee functions
add_edge("class:organisations/models.py:Subscription", "function:organisations/chargebee/chargebee.py:get_subscription_metadata_from_id", "calls", 0.8)
add_edge("class:organisations/models.py:Subscription", "function:organisations/chargebee/chargebee.py:get_portal_url", "calls", 0.8)
add_edge("class:organisations/models.py:Subscription", "function:organisations/chargebee/chargebee.py:add_single_seat", "calls", 0.8)
add_edge("class:organisations/models.py:OrganisationSubscriptionInformationCache", "class:organisations/chargebee/metadata.py:ChargebeeObjMetadata", "calls", 0.8)

# invites
add_edge("class:organisations/invites/models.py:Invite", "class:organisations/invites/exceptions.py:InviteLinksDisabledError", "depends_on", 0.6)
add_edge("class:organisations/invites/views.py:InviteViewSet", "class:organisations/invites/models.py:Invite", "depends_on", 0.6)
add_edge("class:organisations/invites/views.py:InviteLinkViewSet", "class:organisations/invites/models.py:InviteLink", "depends_on", 0.6)

# audit views use permissions
add_edge("class:audit/views.py:OrganisationAuditLogViewSet", "class:audit/permissions.py:OrganisationAuditLogPermissions", "depends_on", 0.6)
add_edge("class:audit/views.py:ProjectAuditLogViewSet", "class:audit/permissions.py:ProjectAuditLogPermissions", "depends_on", 0.6)

# management command -> Organisation model
add_edge("class:organisations/management/commands/check_if_organisations_over_plan_limit.py:Command", "class:organisations/models.py:Organisation", "calls", 0.8)
add_edge("class:organisations/management/commands/createinitialorganisation.py:Command", "class:organisations/models.py:Organisation", "calls", 0.8)

# write
out = {"nodes": nodes, "edges": edges}
with open(".understand-anything/intermediate/batch-1.json", "w") as f:
    json.dump(out, f, indent=2)

# validation summary
imports_count = sum(1 for e in edges if e["type"] == "imports")
expected = sum(len(v) for v in import_data.values())
print("nodes:", len(nodes))
print("edges:", len(edges))
print("imports edges:", imports_count, "expected:", expected)
node_ids = set(n["id"] for n in nodes)
print("unique node ids:", len(node_ids), "==", len(nodes))
# self edges
print("self edges:", sum(1 for e in edges if e["source"] == e["target"]))
