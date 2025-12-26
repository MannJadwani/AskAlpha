# Unused APIs and Features

## 🔴 Unused API Routes

### 1. `/api/admin/migrate-db` 
- **Status**: Not called anywhere
- **Purpose**: Admin route for database migrations
- **Note**: Returns instructions to use Supabase CLI instead
- **Recommendation**: Remove or keep for admin use only







## 🟡 Partially Used / Disabled Features

### 1. `/charts` Page
- **Status**: Accessible via sidebar but shows "Coming Soon"
- **API**: `/api/charts2` exists and works
- **Issue**: UI is wrapped in `<ComingSoon>` component
- **Recommendation**: Remove ComingSoon wrapper or remove entire feature

### 2. `/charts2` Directory
- **Status**: Empty directory (no page.tsx)
- **Recommendation**: Remove empty directory

### 3. `app/components/page/Analysis.tsx`
- **Status**: Component exists but unclear if actively used
- **Purpose**: Company analysis component
- **Recommendation**: Verify usage, remove if unused

## 🟢 Unused Pages/Components

### 1. `app/(report)/my-reports/page-refactored.tsx`
- **Status**: Old refactored version, not used
- **Current**: `page.tsx` is the active version
- **Recommendation**: Remove `page-refactored.tsx`

### 2. `app/(report)/my-reports/README.md` & `SIDEBAR_ENHANCEMENT_SUMMARY.md`
- **Status**: Documentation files
- **Recommendation**: Keep for reference or move to docs folder

## 📊 Summary by Category

### APIs Not Called:
1. `/api/admin/migrate-db` - Admin route
2. `/api/recommendation-followup` - Follow-up Q&A
3. `/api/instruments/search` - Instrument search (verify)

### Features Disabled/Coming Soon:
1. `/charts` - Charts generation (wrapped in ComingSoon)
2. `/charts2` - Empty directory

### Old/Unused Files:
1. `app/(report)/my-reports/page-refactored.tsx` - Old version
2. `app/(report)/charts2/` - Empty directory

## 🎯 Recommendations

### High Priority (Remove):
1. **Remove `/api/admin/migrate-db`** - Not needed, returns instructions
2. **Remove `/api/recommendation-followup`** - Unused feature
3. **Remove `page-refactored.tsx`** - Old file
4. **Remove empty `charts2/` directory**

### Medium Priority (Verify):
1. **Verify `/api/instruments/search`** - Check if used
2. **Decide on `/charts`** - Either enable or remove
3. **Check `Analysis.tsx`** - Verify if component is used

### Low Priority (Keep for now):
1. **Documentation files** - Can keep for reference

## 📝 Action Items

- [ ] Remove unused API routes
- [ ] Remove ComingSoon wrapper from charts or remove feature entirely
- [ ] Remove old/refactored files
- [ ] Clean up empty directories
- [ ] Verify instrument search API usage
- [ ] Update launch readiness checklist

