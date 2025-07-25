# Pair Programming Workflow

## Overview
This document outlines our pair programming workflow for building the Music Visualizer. It ensures consistent process, proper testing, and knowledge capture as we work through the project plan.

## Story Workflow Process

### 1. Story Selection & Planning
**Claude's Actions:**
- Pick up the next ⏳ **Pending** story from the `project_plan_1.md` file
- Review the story's acceptance criteria and testing requirements
- Create a brief implementation plan (2-3 bullet points)
- **Confirm plan with human before proceeding**

### 2. Implementation Preparation
**Claude's Actions:**
- After brief plan is approved by human, create a comprehensive implementation plan
- Build a detailed todo list for the story implementation using TodoWrite tool
- Review `CLAUDE.md` for project-specific commands and architecture notes
- Update todo list to mark story as "in_progress"
- Read any relevant existing files to understand current state

### 3. Implementation
**Claude's Actions:**
- Implement the story following acceptance criteria
- Write clean, well-structured code following established patterns
- Use proper error handling where needed
- Follow Subframe UI component patterns and consistent styling

### 4. Testing & Verification
**Claude's Actions:**
- Run specified tests from the story (unit/integration/manual)
- Execute build commands to verify no compilation errors:
  - `pnpm build` (frontend build)
- Test authentication flows if auth-related changes
- Run any other relevant commands (linting, type checking, etc.)

### 5. Human Verification Request
**Claude's Actions:**
- Summarize what was implemented
- List what should be visible/testable in the app
- **Provide specific testing steps for the human**
- **Prompt human to verify in running app**

**Required format:**
> "## Story X.Y Implementation Complete!
> 
> **Changes made:**
> - [Bulleted list of key changes]
> 
> **Please verify in the app:**
> - Run `pnpm dev` to start the development server
> - Navigate to [specific page/route]
> - [Specific steps to test the functionality]
> - [Expected behavior/output]
> 
> **Expected results:**
> - [What should happen if working correctly]
> - [Any specific UI changes to look for]
> 
> **Ready for your verification!**"

### 6. Human Testing & Feedback
**Human's Actions:**
- Test the changes in the running app (`pnpm dev`)
- Verify acceptance criteria are met
- Provide feedback: "Perfect! That worked!" or describe issues

**If Issues Found:**
- Human describes what went wrong or what's not working
- Claude investigates and fixes the issues
- Return to step 4 (Testing & Verification) after fixes
- Repeat until verification succeeds

### 7. Story Completion
**Claude's Actions (after human confirms success):**
- Mark story as ✅ **Completed** in the `project_plan_1.md` file
- Update todo list to completed
- Update progress tracking in the `project_plan_1.md` file
- Update technical_considerations.md with lessons learned

## Documentation Updates

### During Each Story
**Claude should update these files as needed:**

#### CLAUDE.md Updates
- Add new commands discovered during implementation
- Update architecture notes if patterns change  
- Document any new dependencies or tools
- Note any gotchas or important considerations

#### technical_considerations.md Updates
- Document technical decisions and rationale
- Record issues encountered and solutions
- Note what works well and what to avoid
- Capture performance considerations
- Document testing strategies that work

## Quality Checks

### Before Marking Story Complete
- [ ] All acceptance criteria met
- [ ] All specified tests pass
- [ ] No new console errors or warnings  
- [ ] Code follows project conventions (Subframe UI patterns)
- [ ] Authentication integration working if applicable
- [ ] Relevant documentation updated
- [ ] Human verification completed

### Code Quality Standards
- Use TypeScript types properly
- Follow React best practices and hooks patterns
- Use Subframe components and consistent styling
- Handle errors gracefully with user-friendly messages
- Write clear, self-documenting code
- Keep functions small and focused
- Use the `useAuth()` hook for authentication state

## Communication Patterns

### Starting a Story
Claude: "Ready for Story X.Y: [Title]. My plan: [brief plan]. Does this approach sound good?"

### During Implementation  
Claude: [Work silently through implementation, testing, and verification]

### Requesting Verification
Claude: "Story X.Y implementation complete! Changes: [summary]. Please verify: [specific things to check]. Ready for your verification!"

### After Human Confirmation
Claude: "Great! Marking Story X.Y as completed. Moving to next story..."

## Emergency Procedures

### If Story Becomes Too Complex
- Break it down into smaller sub-tasks
- Document the breakdown in `technical_considerations.md`
- Get human approval for the new approach

### If Architecture Changes Needed
- Document the change rationale in `technical_considerations.md`
- Update `music-visualizer-architecture.md`
- Get human approval before major changes

### If Authentication/Database Issues
- Use the `/test-auth` route to debug Supabase connection issues
- Document database access problems in `technical_considerations.md`
- Check RLS policies and table permissions
- Test with raw HTTP requests if Supabase JS client is hanging

### If Stuck on Technical Issue
- Document the issue in `technical_considerations.md`
- Propose 2-3 alternative approaches
- Ask human for guidance

## Success Metrics
- Stories completed per session
- Build success rate (should be 100%)
- Quality of human verification feedback
- Documentation completeness
- Knowledge capture effectiveness
- Authentication system stability

---

This workflow ensures we maintain quality, capture knowledge, and make steady progress toward our music visualizer MVP goal.