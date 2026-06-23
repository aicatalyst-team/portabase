#!/bin/bash
# Reorganizes src/features/* to match onboarding structure
# Run from project root: bash scripts/migrate-features.sh
set -e

cd /home/soluce/Documents/PROJETS/portabase

# Helper: replace old import path with new across all TS/TSX files in app/ and src/
upd() {
  find app src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | \
    xargs -0 sed -i "s|$1|$2|g"
}

###############################################################################
# AGENTS
###############################################################################
echo "==> agents"
mkdir -p src/features/agents/actions src/features/agents/components \
         src/features/agents/schemas src/features/agents/hooks

git mv src/features/agents/agent-delete.action.ts        src/features/agents/actions/
git mv src/features/agents/agent-organizations.action.ts src/features/agents/actions/
git mv src/features/agents/agents.action.ts              src/features/agents/actions/
git mv src/features/agents/keys.action.ts                src/features/agents/actions/
git mv src/features/agents/agents.schema.ts              src/features/agents/schemas/
git mv src/features/agents/agent-organizations.schema.ts src/features/agents/schemas/
git mv src/features/agents/use-agent-update-check.ts     src/features/agents/hooks/
git mv src/features/agents/agent-card-key.tsx            src/features/agents/components/
git mv src/features/agents/agent-card.tsx                src/features/agents/components/
git mv src/features/agents/agent-content.tsx             src/features/agents/components/
git mv src/features/agents/agent-database-card.tsx       src/features/agents/components/
git mv src/features/agents/agent-database-columns.tsx    src/features/agents/components/
git mv src/features/agents/agent-delete-button.tsx       src/features/agents/components/
git mv src/features/agents/agent-dialog.tsx              src/features/agents/components/
git mv src/features/agents/agent-form.tsx                src/features/agents/components/
git mv src/features/agents/agent-key-modal.tsx           src/features/agents/components/
git mv "src/features/agents/agent-organizations.form.tsx" src/features/agents/components/

# .action/.schema rules must come before generic component rule to avoid double-replacing
upd '@/features/agents/agent-delete\.action'           '@/features/agents/actions/agent-delete.action'
upd '@/features/agents/agent-organizations\.action'    '@/features/agents/actions/agent-organizations.action'
upd '@/features/agents/agents\.action'                 '@/features/agents/actions/agents.action'
upd '@/features/agents/keys\.action'                   '@/features/agents/actions/keys.action'
upd '@/features/agents/agents\.schema'                 '@/features/agents/schemas/agents.schema'
upd '@/features/agents/agent-organizations\.schema'    '@/features/agents/schemas/agent-organizations.schema'
upd '@/features/agents/use-agent-update-check'         '@/features/agents/hooks/use-agent-update-check'
upd '@/features/agents/agent-card-key'                 '@/features/agents/components/agent-card-key'
upd '@/features/agents/agent-organizations\.form'      '@/features/agents/components/agent-organizations.form'
upd '@/features/agents/agent-content'                  '@/features/agents/components/agent-content'
upd '@/features/agents/agent-database-card'            '@/features/agents/components/agent-database-card'
upd '@/features/agents/agent-database-columns'         '@/features/agents/components/agent-database-columns'
upd '@/features/agents/agent-delete-button'            '@/features/agents/components/agent-delete-button'
upd '@/features/agents/agent-dialog'                   '@/features/agents/components/agent-dialog'
upd '@/features/agents/agent-form'                     '@/features/agents/components/agent-form'
upd '@/features/agents/agent-key-modal'                '@/features/agents/components/agent-key-modal'
upd '@/features/agents/agent-card'                     '@/features/agents/components/agent-card'

git add -A
git commit -m "refactor(agents): reorganize into actions/components/schemas/hooks"

###############################################################################
# AUTH
###############################################################################
echo "==> auth"
mkdir -p src/features/auth/actions src/features/auth/components src/features/auth/schemas

git mv src/features/auth/forgot-password.action.ts           src/features/auth/actions/
git mv src/features/auth/reset-password.action.ts            src/features/auth/actions/
git mv src/features/auth/forgot-password-form.schema.ts      src/features/auth/schemas/
git mv src/features/auth/login-form.schema.ts                src/features/auth/schemas/
git mv src/features/auth/register-form.schema.ts             src/features/auth/schemas/
git mv src/features/auth/reset-password-form.schema.ts       src/features/auth/schemas/
git mv src/features/auth/reset-password-page.schema.ts       src/features/auth/schemas/
git mv src/features/auth/auth-logo-section.tsx               src/features/auth/components/
git mv src/features/auth/forgot-password-form.tsx            src/features/auth/components/
git mv src/features/auth/guard-form.tsx                      src/features/auth/components/
git mv src/features/auth/login-form.tsx                      src/features/auth/components/
git mv src/features/auth/register-form.tsx                   src/features/auth/components/
git mv src/features/auth/reset-password-form.tsx             src/features/auth/components/
git mv src/features/auth/social-buttons.tsx                  src/features/auth/components/

upd '@/features/auth/forgot-password\.action'          '@/features/auth/actions/forgot-password.action'
upd '@/features/auth/reset-password\.action'           '@/features/auth/actions/reset-password.action'
upd '@/features/auth/forgot-password-form\.schema'     '@/features/auth/schemas/forgot-password-form.schema'
upd '@/features/auth/login-form\.schema'               '@/features/auth/schemas/login-form.schema'
upd '@/features/auth/register-form\.schema'            '@/features/auth/schemas/register-form.schema'
upd '@/features/auth/reset-password-form\.schema'      '@/features/auth/schemas/reset-password-form.schema'
upd '@/features/auth/reset-password-page\.schema'      '@/features/auth/schemas/reset-password-page.schema'
upd '@/features/auth/auth-logo-section'                '@/features/auth/components/auth-logo-section'
upd '@/features/auth/forgot-password-form'             '@/features/auth/components/forgot-password-form'
upd '@/features/auth/guard-form'                       '@/features/auth/components/guard-form'
upd '@/features/auth/login-form'                       '@/features/auth/components/login-form'
upd '@/features/auth/register-form'                    '@/features/auth/components/register-form'
upd '@/features/auth/reset-password-form'              '@/features/auth/components/reset-password-form'
upd '@/features/auth/social-buttons'                   '@/features/auth/components/social-buttons'

# Fix cross-category relative imports (component → schema)
sed -i "s|from '\./forgot-password-form\.schema'|from '../schemas/forgot-password-form.schema'|g" \
  src/features/auth/components/forgot-password-form.tsx
sed -i "s|from '\./reset-password-form\.schema'|from '../schemas/reset-password-form.schema'|g" \
  src/features/auth/components/reset-password-form.tsx

git add -A
git commit -m "refactor(auth): reorganize into actions/components/schemas"

###############################################################################
# CHANNEL
###############################################################################
echo "==> channel"
mkdir -p src/features/channel/components src/features/channel/schemas

git mv src/features/channel/channel-add-edit-modal.tsx       src/features/channel/components/
git mv src/features/channel/channel-card.tsx                 src/features/channel/components/
git mv src/features/channel/channel-delete-button.tsx        src/features/channel/components/
git mv src/features/channel/channel-edit-button.tsx          src/features/channel/components/
git mv src/features/channel/channel-form.tsx                 src/features/channel/components/
git mv src/features/channel/channel-test-button.tsx          src/features/channel/components/
git mv src/features/channel/channels-helpers.tsx             src/features/channel/components/
git mv src/features/channel/channels-notification-helper.tsx src/features/channel/components/
git mv src/features/channel/channels-section.tsx             src/features/channel/components/
git mv src/features/channel/channels-storage-helper.tsx      src/features/channel/components/
git mv src/features/channel/channel-form.schema.ts           src/features/channel/schemas/
# Move entire subdirs (inner structure stays intact)
git mv src/features/channel/notifications                    src/features/channel/components/notifications
git mv src/features/channel/storages                         src/features/channel/components/storages

upd '@/features/channel/channel-form\.schema'              '@/features/channel/schemas/channel-form.schema'
upd '@/features/channel/channel-add-edit-modal'            '@/features/channel/components/channel-add-edit-modal'
upd '@/features/channel/channel-card'                      '@/features/channel/components/channel-card'
upd '@/features/channel/channel-delete-button'             '@/features/channel/components/channel-delete-button'
upd '@/features/channel/channel-edit-button'               '@/features/channel/components/channel-edit-button'
upd '@/features/channel/channel-test-button'               '@/features/channel/components/channel-test-button'
upd '@/features/channel/channels-helpers'                  '@/features/channel/components/channels-helpers'
upd '@/features/channel/channels-notification-helper'      '@/features/channel/components/channels-notification-helper'
upd '@/features/channel/channels-section'                  '@/features/channel/components/channels-section'
upd '@/features/channel/channels-storage-helper'           '@/features/channel/components/channels-storage-helper'
upd '@/features/channel/channel-form'                      '@/features/channel/components/channel-form'
# These trailing-slash patterns update all imports under notifications/ and storages/ at once
upd '@/features/channel/notifications/'                    '@/features/channel/components/notifications/'
upd '@/features/channel/storages/'                         '@/features/channel/components/storages/'

git add -A
git commit -m "refactor(channel): reorganize into components/schemas, nest notifications+storages under components"

###############################################################################
# DATABASE
###############################################################################
echo "==> database"
mkdir -p src/features/database/actions src/features/database/components src/features/database/schemas

git mv src/features/database/backup-actions.action.ts        src/features/database/actions/
git mv src/features/database/backup-button.action.ts         src/features/database/actions/
git mv src/features/database/backup-get-data.action.ts       src/features/database/actions/
git mv src/features/database/channels-policy.action.ts       src/features/database/actions/
git mv src/features/database/cron.action.ts                  src/features/database/actions/
git mv src/features/database/database-form.action.ts         src/features/database/actions/
git mv src/features/database/import.action.ts                src/features/database/actions/
git mv src/features/database/restore.action.ts               src/features/database/actions/
git mv src/features/database/retention-policy.action.ts      src/features/database/actions/
git mv src/features/database/backup-actions.schema.ts        src/features/database/schemas/
git mv src/features/database/channels-policy.schema.ts       src/features/database/schemas/
git mv src/features/database/database-form.schema.ts         src/features/database/schemas/
git mv src/features/database/retention-policy.schema.ts      src/features/database/schemas/
for f in \
  backup-actions-cell.tsx backup-actions-form.tsx backup-actions-modal.tsx \
  backup-button.tsx backup-columns.tsx backup-modal-context.tsx \
  channels-policy-form.tsx channels-policy-modal.tsx \
  cron-advanced-select.tsx cron-button.tsx cron-input.tsx \
  database-backup-list.tsx database-content.tsx database-form.tsx \
  database-kpi.tsx database-restore-list.tsx database-tabs.tsx \
  health-grid.tsx health-modal.tsx \
  import-modal.tsx import-upload-zone.tsx \
  restore-columns.tsx \
  retention-policy-form.tsx retention-policy-sheet.tsx retention-policy.tsx
do
  git mv "src/features/database/$f" src/features/database/components/
done

upd '@/features/database/backup-actions\.action'       '@/features/database/actions/backup-actions.action'
upd '@/features/database/backup-button\.action'        '@/features/database/actions/backup-button.action'
upd '@/features/database/backup-get-data\.action'      '@/features/database/actions/backup-get-data.action'
upd '@/features/database/channels-policy\.action'      '@/features/database/actions/channels-policy.action'
upd '@/features/database/cron\.action'                 '@/features/database/actions/cron.action'
upd '@/features/database/database-form\.action'        '@/features/database/actions/database-form.action'
upd '@/features/database/import\.action'               '@/features/database/actions/import.action'
upd '@/features/database/restore\.action'              '@/features/database/actions/restore.action'
upd '@/features/database/retention-policy\.action'     '@/features/database/actions/retention-policy.action'
upd '@/features/database/backup-actions\.schema'       '@/features/database/schemas/backup-actions.schema'
upd '@/features/database/channels-policy\.schema'      '@/features/database/schemas/channels-policy.schema'
upd '@/features/database/database-form\.schema'        '@/features/database/schemas/database-form.schema'
upd '@/features/database/retention-policy\.schema'     '@/features/database/schemas/retention-policy.schema'
upd '@/features/database/backup-actions-cell'          '@/features/database/components/backup-actions-cell'
upd '@/features/database/backup-actions-form'          '@/features/database/components/backup-actions-form'
upd '@/features/database/backup-actions-modal'         '@/features/database/components/backup-actions-modal'
upd '@/features/database/backup-columns'               '@/features/database/components/backup-columns'
upd '@/features/database/backup-modal-context'         '@/features/database/components/backup-modal-context'
upd '@/features/database/backup-button'                '@/features/database/components/backup-button'
upd '@/features/database/channels-policy-form'         '@/features/database/components/channels-policy-form'
upd '@/features/database/channels-policy-modal'        '@/features/database/components/channels-policy-modal'
upd '@/features/database/cron-advanced-select'         '@/features/database/components/cron-advanced-select'
upd '@/features/database/cron-button'                  '@/features/database/components/cron-button'
upd '@/features/database/cron-input'                   '@/features/database/components/cron-input'
upd '@/features/database/database-backup-list'         '@/features/database/components/database-backup-list'
upd '@/features/database/database-content'             '@/features/database/components/database-content'
upd '@/features/database/database-form'                '@/features/database/components/database-form'
upd '@/features/database/database-kpi'                 '@/features/database/components/database-kpi'
upd '@/features/database/database-restore-list'        '@/features/database/components/database-restore-list'
upd '@/features/database/database-tabs'                '@/features/database/components/database-tabs'
upd '@/features/database/health-grid'                  '@/features/database/components/health-grid'
upd '@/features/database/health-modal'                 '@/features/database/components/health-modal'
upd '@/features/database/import-modal'                 '@/features/database/components/import-modal'
upd '@/features/database/import-upload-zone'           '@/features/database/components/import-upload-zone'
upd '@/features/database/restore-columns'              '@/features/database/components/restore-columns'
upd '@/features/database/retention-policy-form'        '@/features/database/components/retention-policy-form'
upd '@/features/database/retention-policy-sheet'       '@/features/database/components/retention-policy-sheet'
upd '@/features/database/retention-policy'             '@/features/database/components/retention-policy'

git add -A
git commit -m "refactor(database): reorganize into actions/components/schemas"

###############################################################################
# LAYOUT
###############################################################################
echo "==> layout"
mkdir -p src/features/layout/components

for f in \
  app-sidebar.tsx card-auth.tsx demo-reset-banner.tsx header.tsx \
  logged-in-button.server.tsx logged-in-button.tsx logged-in-dropdown.tsx \
  logo-sidebar.tsx menu-sidebar-main.tsx menu-sidebar.tsx page.tsx \
  profile-modal.tsx profile-sidebar.tsx side-bar-footer-credit.tsx
do
  git mv "src/features/layout/$f" src/features/layout/components/
done

# .server must come before bare logged-in-button to avoid double-replacing
upd '@/features/layout/logged-in-button\.server'       '@/features/layout/components/logged-in-button.server'
upd '@/features/layout/app-sidebar'                    '@/features/layout/components/app-sidebar'
upd '@/features/layout/card-auth'                      '@/features/layout/components/card-auth'
upd '@/features/layout/demo-reset-banner'              '@/features/layout/components/demo-reset-banner'
upd '@/features/layout/header'                         '@/features/layout/components/header'
upd '@/features/layout/logged-in-button'               '@/features/layout/components/logged-in-button'
upd '@/features/layout/logged-in-dropdown'             '@/features/layout/components/logged-in-dropdown'
upd '@/features/layout/logo-sidebar'                   '@/features/layout/components/logo-sidebar'
upd '@/features/layout/menu-sidebar-main'              '@/features/layout/components/menu-sidebar-main'
upd '@/features/layout/menu-sidebar'                   '@/features/layout/components/menu-sidebar'
upd '@/features/layout/page'                           '@/features/layout/components/page'
upd '@/features/layout/profile-modal'                  '@/features/layout/components/profile-modal'
upd '@/features/layout/profile-sidebar'                '@/features/layout/components/profile-sidebar'
upd '@/features/layout/side-bar-footer-credit'         '@/features/layout/components/side-bar-footer-credit'
# layout relative imports (logged-in-button.tsx→logged-in-dropdown, etc.)
# all files end up in components/ together, so ./X relative imports remain valid — no fix needed

git add -A
git commit -m "refactor(layout): move all components to components/"

###############################################################################
# LOGS
###############################################################################
echo "==> logs"
mkdir -p src/features/logs/components src/features/logs/types

git mv src/features/logs/log-row-modal.tsx      src/features/logs/components/
git mv src/features/logs/logs-modal-context.tsx src/features/logs/components/
git mv src/features/logs/logs-modal-trigger.tsx src/features/logs/components/
git mv src/features/logs/logs-modal.tsx         src/features/logs/components/
git mv src/features/logs/types.ts               src/features/logs/types/index.ts

upd '@/features/logs/log-row-modal'             '@/features/logs/components/log-row-modal'
upd '@/features/logs/logs-modal-context'        '@/features/logs/components/logs-modal-context'
upd '@/features/logs/logs-modal-trigger'        '@/features/logs/components/logs-modal-trigger'
upd '@/features/logs/logs-modal'                '@/features/logs/components/logs-modal'
# @/features/logs/types still resolves to types/index.ts — no import update needed

git add -A
git commit -m "refactor(logs): reorganize into components/types"

###############################################################################
# MIGRATION
###############################################################################
echo "==> migration"
mkdir -p src/features/migration/actions src/features/migration/components

git mv src/features/migration/migration.action.ts src/features/migration/actions/
git mv src/features/migration/migration-flow.tsx  src/features/migration/components/
git mv src/features/migration/migration-tool.tsx  src/features/migration/components/
git mv src/features/migration/source-panel.tsx    src/features/migration/components/
git mv src/features/migration/target-panel.tsx    src/features/migration/components/

upd '@/features/migration/migration\.action'    '@/features/migration/actions/migration.action'
upd '@/features/migration/migration-flow'       '@/features/migration/components/migration-flow'
upd '@/features/migration/migration-tool'       '@/features/migration/components/migration-tool'
upd '@/features/migration/source-panel'         '@/features/migration/components/source-panel'
upd '@/features/migration/target-panel'         '@/features/migration/components/target-panel'

git add -A
git commit -m "refactor(migration): reorganize into actions/components"

###############################################################################
# NOTIFICATIONS
###############################################################################
echo "==> notifications"
mkdir -p src/features/notifications/components src/features/notifications/types src/features/notifications/utils

git mv src/features/notifications/notification-log-columns.tsx  src/features/notifications/components/
git mv src/features/notifications/notification-log-modal.tsx    src/features/notifications/components/
git mv src/features/notifications/notification-logs-list.tsx    src/features/notifications/components/
git mv src/features/notifications/notifications.types.ts        src/features/notifications/types/index.ts
git mv src/features/notifications/notifications.dispatch.ts     src/features/notifications/utils/
git mv src/features/notifications/notifications.helpers.ts      src/features/notifications/utils/

upd '@/features/notifications/notification-log-columns'         '@/features/notifications/components/notification-log-columns'
upd '@/features/notifications/notification-log-modal'           '@/features/notifications/components/notification-log-modal'
upd '@/features/notifications/notification-logs-list'           '@/features/notifications/components/notification-logs-list'
upd '@/features/notifications/notifications\.types'             '@/features/notifications/types'
upd '@/features/notifications/notifications\.dispatch'          '@/features/notifications/utils/notifications.dispatch'
upd '@/features/notifications/notifications\.helpers'           '@/features/notifications/utils/notifications.helpers'

git add -A
git commit -m "refactor(notifications): reorganize into components/types/utils"

###############################################################################
# ORGANIZATIONS
###############################################################################
echo "==> organizations"
mkdir -p src/features/organizations/actions src/features/organizations/components \
         src/features/organizations/schemas src/features/organizations/hooks \
         src/features/organizations/utils

git mv src/features/organizations/add-member.action.ts          src/features/organizations/actions/
git mv src/features/organizations/channels-organization.action.ts src/features/organizations/actions/
git mv src/features/organizations/organization.action.ts        src/features/organizations/actions/
git mv src/features/organizations/role-member.action.ts         src/features/organizations/actions/
git mv src/features/organizations/update-member.action.ts       src/features/organizations/actions/
git mv src/features/organizations/admin-organization.schema.ts  src/features/organizations/schemas/
git mv src/features/organizations/channels-organization.schema.ts src/features/organizations/schemas/
git mv src/features/organizations/member.schema.ts              src/features/organizations/schemas/
git mv src/features/organizations/organization.schema.ts        src/features/organizations/schemas/
git mv src/features/organizations/use-organization-permissions.ts src/features/organizations/hooks/
git mv src/features/organizations/organization-cookie.ts        src/features/organizations/utils/
for f in \
  admin-organization-add-modal.tsx admin-organization-delete-button.tsx \
  admin-organization-form.tsx admin-organization-list.tsx \
  admin-organization-management.tsx admin-organization-section.tsx \
  admin-organizations-table.tsx admin-org-columns.tsx \
  channels-organization-form.tsx member-columns.tsx \
  organization-add-member-form.tsx organization-add-member-modal.tsx \
  organization-agents-tab.tsx organization-columns.tsx organization-combobox.tsx \
  organization-create-modal.tsx organization-delete-button.tsx \
  organization-delete-member-modal.tsx organization-edit-dialog.tsx \
  organization-form.tsx organization-member-card.tsx \
  organization-member-change-role.tsx organization-members-table.tsx \
  organization-notifiers-tab.tsx organization-storages-tab.tsx \
  organization-tabs.tsx update-organization-form.tsx
do
  git mv "src/features/organizations/$f" src/features/organizations/components/
done

upd '@/features/organizations/add-member\.action'               '@/features/organizations/actions/add-member.action'
upd '@/features/organizations/channels-organization\.action'    '@/features/organizations/actions/channels-organization.action'
upd '@/features/organizations/organization\.action'             '@/features/organizations/actions/organization.action'
upd '@/features/organizations/role-member\.action'              '@/features/organizations/actions/role-member.action'
upd '@/features/organizations/update-member\.action'            '@/features/organizations/actions/update-member.action'
upd '@/features/organizations/admin-organization\.schema'       '@/features/organizations/schemas/admin-organization.schema'
upd '@/features/organizations/channels-organization\.schema'    '@/features/organizations/schemas/channels-organization.schema'
upd '@/features/organizations/member\.schema'                   '@/features/organizations/schemas/member.schema'
upd '@/features/organizations/organization\.schema'             '@/features/organizations/schemas/organization.schema'
upd '@/features/organizations/use-organization-permissions'     '@/features/organizations/hooks/use-organization-permissions'
upd '@/features/organizations/organization-cookie'              '@/features/organizations/utils/organization-cookie'
upd '@/features/organizations/admin-organization-add-modal'     '@/features/organizations/components/admin-organization-add-modal'
upd '@/features/organizations/admin-organization-delete-button' '@/features/organizations/components/admin-organization-delete-button'
upd '@/features/organizations/admin-organization-form'          '@/features/organizations/components/admin-organization-form'
upd '@/features/organizations/admin-organization-list'          '@/features/organizations/components/admin-organization-list'
upd '@/features/organizations/admin-organization-management'    '@/features/organizations/components/admin-organization-management'
upd '@/features/organizations/admin-organization-section'       '@/features/organizations/components/admin-organization-section'
upd '@/features/organizations/admin-organizations-table'        '@/features/organizations/components/admin-organizations-table'
upd '@/features/organizations/admin-org-columns'                '@/features/organizations/components/admin-org-columns'
upd '@/features/organizations/channels-organization-form'       '@/features/organizations/components/channels-organization-form'
upd '@/features/organizations/member-columns'                   '@/features/organizations/components/member-columns'
upd '@/features/organizations/organization-add-member-form'     '@/features/organizations/components/organization-add-member-form'
upd '@/features/organizations/organization-add-member-modal'    '@/features/organizations/components/organization-add-member-modal'
upd '@/features/organizations/organization-agents-tab'          '@/features/organizations/components/organization-agents-tab'
upd '@/features/organizations/organization-columns'             '@/features/organizations/components/organization-columns'
upd '@/features/organizations/organization-combobox'            '@/features/organizations/components/organization-combobox'
upd '@/features/organizations/organization-create-modal'        '@/features/organizations/components/organization-create-modal'
upd '@/features/organizations/organization-delete-button'       '@/features/organizations/components/organization-delete-button'
upd '@/features/organizations/organization-delete-member-modal' '@/features/organizations/components/organization-delete-member-modal'
upd '@/features/organizations/organization-edit-dialog'         '@/features/organizations/components/organization-edit-dialog'
upd '@/features/organizations/organization-form'                '@/features/organizations/components/organization-form'
upd '@/features/organizations/organization-member-card'         '@/features/organizations/components/organization-member-card'
upd '@/features/organizations/organization-member-change-role'  '@/features/organizations/components/organization-member-change-role'
upd '@/features/organizations/organization-members-table'       '@/features/organizations/components/organization-members-table'
upd '@/features/organizations/organization-notifiers-tab'       '@/features/organizations/components/organization-notifiers-tab'
upd '@/features/organizations/organization-storages-tab'        '@/features/organizations/components/organization-storages-tab'
upd '@/features/organizations/organization-tabs'                '@/features/organizations/components/organization-tabs'
upd '@/features/organizations/update-organization-form'         '@/features/organizations/components/update-organization-form'

git add -A
git commit -m "refactor(organizations): reorganize into actions/components/schemas/hooks/utils"

###############################################################################
# PROFILE
###############################################################################
echo "==> profile"
mkdir -p src/features/profile/actions src/features/profile/components src/features/profile/schemas

git mv src/features/profile/avatar.action.ts    src/features/profile/actions/
git mv src/features/profile/profile.action.ts   src/features/profile/actions/
git mv src/features/profile/provider.action.ts  src/features/profile/actions/
git mv src/features/profile/security.action.ts  src/features/profile/actions/
git mv src/features/profile/2fa.schema.ts       src/features/profile/schemas/
git mv src/features/profile/account.schema.ts   src/features/profile/schemas/
git mv src/features/profile/general.schema.ts   src/features/profile/schemas/
git mv src/features/profile/provider.schema.ts  src/features/profile/schemas/
git mv src/features/profile/security.schema.ts  src/features/profile/schemas/
for f in \
  2fa-form.tsx avatar-with-upload.tsx backup-codes-list.tsx \
  disable-2fa-modal.tsx profile-account.tsx profile-api-keys.tsx \
  profile-appearance.tsx profile-general.tsx profile-providers.tsx \
  profile-reset-password-form.tsx profile-security.tsx \
  reset-password-modal.tsx set-password-form.tsx set-password-modal.tsx \
  setup-2fa-modal.tsx two-factor-setup-content.tsx view-backup-codes-modal.tsx
do
  git mv "src/features/profile/$f" src/features/profile/components/
done

upd '@/features/profile/avatar\.action'              '@/features/profile/actions/avatar.action'
upd '@/features/profile/profile\.action'             '@/features/profile/actions/profile.action'
upd '@/features/profile/provider\.action'            '@/features/profile/actions/provider.action'
upd '@/features/profile/security\.action'            '@/features/profile/actions/security.action'
upd '@/features/profile/2fa\.schema'                 '@/features/profile/schemas/2fa.schema'
upd '@/features/profile/account\.schema'             '@/features/profile/schemas/account.schema'
upd '@/features/profile/general\.schema'             '@/features/profile/schemas/general.schema'
upd '@/features/profile/provider\.schema'            '@/features/profile/schemas/provider.schema'
upd '@/features/profile/security\.schema'            '@/features/profile/schemas/security.schema'
upd '@/features/profile/2fa-form'                    '@/features/profile/components/2fa-form'
upd '@/features/profile/avatar-with-upload'          '@/features/profile/components/avatar-with-upload'
upd '@/features/profile/backup-codes-list'           '@/features/profile/components/backup-codes-list'
upd '@/features/profile/disable-2fa-modal'           '@/features/profile/components/disable-2fa-modal'
upd '@/features/profile/profile-account'             '@/features/profile/components/profile-account'
upd '@/features/profile/profile-api-keys'            '@/features/profile/components/profile-api-keys'
upd '@/features/profile/profile-appearance'          '@/features/profile/components/profile-appearance'
upd '@/features/profile/profile-general'             '@/features/profile/components/profile-general'
upd '@/features/profile/profile-providers'           '@/features/profile/components/profile-providers'
upd '@/features/profile/profile-reset-password-form' '@/features/profile/components/profile-reset-password-form'
upd '@/features/profile/profile-security'            '@/features/profile/components/profile-security'
upd '@/features/profile/reset-password-modal'        '@/features/profile/components/reset-password-modal'
upd '@/features/profile/set-password-form'           '@/features/profile/components/set-password-form'
upd '@/features/profile/set-password-modal'          '@/features/profile/components/set-password-modal'
upd '@/features/profile/setup-2fa-modal'             '@/features/profile/components/setup-2fa-modal'
upd '@/features/profile/two-factor-setup-content'    '@/features/profile/components/two-factor-setup-content'
upd '@/features/profile/view-backup-codes-modal'     '@/features/profile/components/view-backup-codes-modal'

# Fix cross-category relative imports (all files are now in components/, referencing actions/ and schemas/)
sed -i "s|from '\./provider\.schema'|from '../schemas/provider.schema'|g"   src/features/profile/components/set-password-form.tsx
sed -i "s|from '\./provider\.action'|from '../actions/provider.action'|g"   src/features/profile/components/set-password-form.tsx
sed -i "s|from '\./account\.schema'|from '../schemas/account.schema'|g"     src/features/profile/components/profile-account.tsx
sed -i "s|from '\./security\.action'|from '../actions/security.action'|g"   src/features/profile/components/profile-security.tsx
sed -i "s|from '\./security\.schema'|from '../schemas/security.schema'|g"   src/features/profile/components/profile-reset-password-form.tsx
sed -i "s|from '\./2fa\.schema'|from '../schemas/2fa.schema'|g"             src/features/profile/components/2fa-form.tsx
sed -i "s|from '\./security\.schema'|from '../schemas/security.schema'|g"   src/features/profile/components/two-factor-setup-content.tsx
sed -i "s|from '\./profile\.action'|from '../actions/profile.action'|g"     src/features/profile/components/profile-general.tsx
sed -i "s|from '\./general\.schema'|from '../schemas/general.schema'|g"     src/features/profile/components/profile-general.tsx

git add -A
git commit -m "refactor(profile): reorganize into actions/components/schemas"

###############################################################################
# PROJECTS
###############################################################################
echo "==> projects"
mkdir -p src/features/projects/actions src/features/projects/components src/features/projects/schemas

git mv src/features/projects/project-delete.action.ts  src/features/projects/actions/
git mv src/features/projects/projects.action.ts        src/features/projects/actions/
git mv src/features/projects/projects.schema.ts        src/features/projects/schemas/
git mv src/features/projects/project-card.tsx          src/features/projects/components/
git mv src/features/projects/project-database-card.tsx src/features/projects/components/
git mv src/features/projects/project-delete-button.tsx src/features/projects/components/
git mv src/features/projects/project-dialog.tsx        src/features/projects/components/
git mv src/features/projects/project-form.tsx          src/features/projects/components/

upd '@/features/projects/project-delete\.action'    '@/features/projects/actions/project-delete.action'
upd '@/features/projects/projects\.action'          '@/features/projects/actions/projects.action'
upd '@/features/projects/projects\.schema'          '@/features/projects/schemas/projects.schema'
upd '@/features/projects/project-card'              '@/features/projects/components/project-card'
upd '@/features/projects/project-database-card'     '@/features/projects/components/project-database-card'
upd '@/features/projects/project-delete-button'     '@/features/projects/components/project-delete-button'
upd '@/features/projects/project-dialog'            '@/features/projects/components/project-dialog'
upd '@/features/projects/project-form'              '@/features/projects/components/project-form'

git add -A
git commit -m "refactor(projects): reorganize into actions/components/schemas"

###############################################################################
# SETTINGS
###############################################################################
echo "==> settings"
mkdir -p src/features/settings/actions src/features/settings/components \
         src/features/settings/schemas src/features/settings/hooks

git mv src/features/settings/avatar.action.ts      src/features/settings/actions/
git mv src/features/settings/email-form.action.ts  src/features/settings/actions/
git mv src/features/settings/notification.action.ts src/features/settings/actions/
git mv src/features/settings/storage.action.ts     src/features/settings/actions/
git mv src/features/settings/storage-s3.action.ts  src/features/settings/actions/
git mv src/features/settings/email-form.schema.ts  src/features/settings/schemas/
git mv src/features/settings/notification.schema.ts src/features/settings/schemas/
git mv src/features/settings/storage-s3.schema.ts  src/features/settings/schemas/
git mv src/features/settings/storage.schema.ts     src/features/settings/schemas/
git mv src/features/settings/use-dicebear-styles.ts src/features/settings/hooks/
for f in \
  avatar-mode-selector.tsx avatar-section.tsx dicebear-style-picker.tsx \
  email-form.tsx email-section.tsx notification-section.tsx \
  settings-tabs.tsx storage-s3-form.tsx storage-section.tsx
do
  git mv "src/features/settings/$f" src/features/settings/components/
done

upd '@/features/settings/avatar\.action'         '@/features/settings/actions/avatar.action'
upd '@/features/settings/email-form\.action'     '@/features/settings/actions/email-form.action'
upd '@/features/settings/notification\.action'   '@/features/settings/actions/notification.action'
upd '@/features/settings/storage-s3\.action'     '@/features/settings/actions/storage-s3.action'
upd '@/features/settings/storage\.action'        '@/features/settings/actions/storage.action'
upd '@/features/settings/email-form\.schema'     '@/features/settings/schemas/email-form.schema'
upd '@/features/settings/notification\.schema'   '@/features/settings/schemas/notification.schema'
upd '@/features/settings/storage-s3\.schema'     '@/features/settings/schemas/storage-s3.schema'
upd '@/features/settings/storage\.schema'        '@/features/settings/schemas/storage.schema'
upd '@/features/settings/use-dicebear-styles'    '@/features/settings/hooks/use-dicebear-styles'
upd '@/features/settings/avatar-mode-selector'   '@/features/settings/components/avatar-mode-selector'
upd '@/features/settings/avatar-section'         '@/features/settings/components/avatar-section'
upd '@/features/settings/dicebear-style-picker'  '@/features/settings/components/dicebear-style-picker'
upd '@/features/settings/email-form'             '@/features/settings/components/email-form'
upd '@/features/settings/email-section'          '@/features/settings/components/email-section'
upd '@/features/settings/notification-section'   '@/features/settings/components/notification-section'
upd '@/features/settings/settings-tabs'          '@/features/settings/components/settings-tabs'
upd '@/features/settings/storage-s3-form'        '@/features/settings/components/storage-s3-form'
upd '@/features/settings/storage-section'        '@/features/settings/components/storage-section'

git add -A
git commit -m "refactor(settings): reorganize into actions/components/schemas/hooks"

###############################################################################
# STATISTICS
###############################################################################
echo "==> statistics"
mkdir -p src/features/statistics/components src/features/statistics/utils

git mv src/features/statistics/chart-placeholder.tsx    src/features/statistics/components/
git mv src/features/statistics/evolution-line-chart.tsx src/features/statistics/components/
git mv src/features/statistics/line-chart.tsx           src/features/statistics/components/
git mv src/features/statistics/percentage-line-chart.tsx src/features/statistics/components/
git mv src/features/statistics/fake-data.ts             src/features/statistics/utils/

upd '@/features/statistics/chart-placeholder'      '@/features/statistics/components/chart-placeholder'
upd '@/features/statistics/evolution-line-chart'   '@/features/statistics/components/evolution-line-chart'
upd '@/features/statistics/line-chart'             '@/features/statistics/components/line-chart'
upd '@/features/statistics/percentage-line-chart'  '@/features/statistics/components/percentage-line-chart'
upd '@/features/statistics/fake-data'              '@/features/statistics/utils/fake-data'

git add -A
git commit -m "refactor(statistics): reorganize into components/utils"

###############################################################################
# STORAGES
###############################################################################
echo "==> storages"
mkdir -p src/features/storages/types src/features/storages/utils

git mv src/features/storages/storages.types.ts    src/features/storages/types/index.ts
git mv src/features/storages/storages.dispatch.ts src/features/storages/utils/
git mv src/features/storages/storages.helpers.ts  src/features/storages/utils/

upd '@/features/storages/storages\.types'    '@/features/storages/types'
upd '@/features/storages/storages\.dispatch' '@/features/storages/utils/storages.dispatch'
upd '@/features/storages/storages\.helpers'  '@/features/storages/utils/storages.helpers'

git add -A
git commit -m "refactor(storages): reorganize into types/utils"

###############################################################################
# THEME
###############################################################################
echo "==> theme"
mkdir -p src/features/theme/components

git mv src/features/theme/mode-toggle.tsx              src/features/theme/components/
git mv src/features/theme/theme-meta-updater-root.tsx  src/features/theme/components/
git mv src/features/theme/theme-meta-updater.tsx       src/features/theme/components/
git mv src/features/theme/theme-provider.tsx           src/features/theme/components/

upd '@/features/theme/mode-toggle'             '@/features/theme/components/mode-toggle'
upd '@/features/theme/theme-meta-updater-root' '@/features/theme/components/theme-meta-updater-root'
upd '@/features/theme/theme-meta-updater'      '@/features/theme/components/theme-meta-updater'
upd '@/features/theme/theme-provider'          '@/features/theme/components/theme-provider'

git add -A
git commit -m "refactor(theme): move all components to components/"

###############################################################################
# UPDATES
###############################################################################
echo "==> updates"
mkdir -p src/features/updates/components src/features/updates/hooks

git mv src/features/updates/update-notification.tsx src/features/updates/components/
git mv src/features/updates/use-update-check.ts     src/features/updates/hooks/

upd '@/features/updates/update-notification' '@/features/updates/components/update-notification'
upd '@/features/updates/use-update-check'    '@/features/updates/hooks/use-update-check'

# Fix cross-category relative import (component → hook)
sed -i "s|from '\./use-update-check'|from '../hooks/use-update-check'|g" \
  src/features/updates/components/update-notification.tsx

git add -A
git commit -m "refactor(updates): reorganize into components/hooks"

###############################################################################
# UPLOAD
###############################################################################
echo "==> upload"
mkdir -p src/features/upload/actions

git mv src/features/upload/upload.action.ts src/features/upload/actions/

upd '@/features/upload/upload\.action' '@/features/upload/actions/upload.action'

git add -A
git commit -m "refactor(upload): move action to actions/"

###############################################################################
# USERS
###############################################################################
echo "==> users"
mkdir -p src/features/users/actions src/features/users/components src/features/users/schemas

git mv src/features/users/user.action.ts src/features/users/actions/
git mv src/features/users/user.schema.ts src/features/users/schemas/
for f in \
  admin-user-add-modal.tsx admin-user-change-password-modal.tsx \
  admin-user-change-role-modal.tsx admin-user-delete-modal.tsx \
  admin-user-edit-form.tsx admin-user-edit-modal.tsx \
  admin-user-form.tsx admin-user-list.tsx \
  user-actions-cell.tsx user-columns.tsx
do
  git mv "src/features/users/$f" src/features/users/components/
done

upd '@/features/users/user\.action'                      '@/features/users/actions/user.action'
upd '@/features/users/user\.schema'                      '@/features/users/schemas/user.schema'
upd '@/features/users/admin-user-add-modal'              '@/features/users/components/admin-user-add-modal'
upd '@/features/users/admin-user-change-password-modal'  '@/features/users/components/admin-user-change-password-modal'
upd '@/features/users/admin-user-change-role-modal'      '@/features/users/components/admin-user-change-role-modal'
upd '@/features/users/admin-user-delete-modal'           '@/features/users/components/admin-user-delete-modal'
upd '@/features/users/admin-user-edit-form'              '@/features/users/components/admin-user-edit-form'
upd '@/features/users/admin-user-edit-modal'             '@/features/users/components/admin-user-edit-modal'
upd '@/features/users/admin-user-form'                   '@/features/users/components/admin-user-form'
upd '@/features/users/admin-user-list'                   '@/features/users/components/admin-user-list'
upd '@/features/users/user-actions-cell'                 '@/features/users/components/user-actions-cell'
upd '@/features/users/user-columns'                      '@/features/users/components/user-columns'

git add -A
git commit -m "refactor(users): reorganize into actions/components/schemas"

echo ""
echo "✓ All features migrated. Run: npx tsc --noEmit"
