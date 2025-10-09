# Restore Points

This document tracks stable versions of the Project Manager application that can be restored to.

## v1.0-groups-complete

**Date:** October 9, 2025
**Description:** Stable version with Groups/Teams feature fully working

**Features included:**
- Complete project management with Gantt charts
- Task dependencies (4 types: FS, SS, FF, SF)
- File uploads and attachments
- Comments and activity tracking
- Team collaboration with 4 role levels (owner, manager, member, viewer)
- Groups/Teams functionality with task assignment
- Export to Excel, CSV, and PDF
- JWT authentication with refresh tokens
- Docker containerization

**All features tested and working on production VPS**

### How to Restore

#### Option 1: View this version (read-only)
```bash
git checkout v1.0-groups-complete
```

#### Option 2: Create a new branch from this version
```bash
git checkout -b feature-name v1.0-groups-complete
```

#### Option 3: Hard reset to this version (CAUTION: loses all changes after this point)
```bash
git checkout main
git reset --hard v1.0-groups-complete
git push origin main --force  # Only if you want to update remote
```

#### Option 4: Restore specific files from this version
```bash
git checkout v1.0-groups-complete -- path/to/file
```

### View All Available Tags
```bash
git tag -l
```

### View Tag Details
```bash
git show v1.0-groups-complete
```

---

## Future Restore Points

Add new restore points below as the project evolves...
