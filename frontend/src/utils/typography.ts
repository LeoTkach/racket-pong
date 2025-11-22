/**
 * Typography constants for consistent text styling across the application
 */

export const typography = {
  // Page Titles (H1)
  pageTitle: 'text-3xl font-bold cursor-default',
  
  // Section Titles (H2)
  sectionTitle: 'text-5xl sm:text-6xl md:text-7xl font-bold cursor-default',
  
  // Section Title - Tournament Name Style (matches tournament detail page)
  sectionTitleTournament: 'font-medium tracking-tight cursor-default',
  sectionTitleTournamentStyle: {
    fontSize: '3.75rem', // text-6xl (60px)
    lineHeight: '57px', // 57px (0.95 от 60px)
    fontWeight: 500,
    letterSpacing: '-0.025em',
  },
  
  // Subsection Titles (H3)
  subsectionTitle: 'text-2xl font-semibold cursor-default',
  
  // Card Titles (H3)
  cardTitle: 'text-2xl font-semibold cursor-default',
  
  // Body Text
  body: 'text-base cursor-default',
  bodyLarge: 'text-lg cursor-default',
  bodySmall: 'text-sm cursor-default',
  
  // Subtitles/Descriptions
  subtitle: 'text-xl text-muted-foreground cursor-default',
  description: 'text-base text-muted-foreground cursor-default',
  
  // Hero Section
  heroTitle: {
    fontSize: 'clamp(3rem, 8vw, 6.5rem)',
    lineHeight: '1.1',
    fontWeight: 500,
    letterSpacing: '-0.025em',
    cursor: 'default',
  },
  heroDescription: {
    fontSize: '1.25rem',
    lineHeight: '32.5px',
    fontWeight: 500,
    cursor: 'default',
  },
  
  // Spacing
  spacing: {
    titleMargin: 'mb-6',
    subtitleMargin: 'mb-4',
    paragraphMargin: 'mb-2',
  },
  
  // Line Heights
  lineHeight: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
  
  // Navigation (Header)
  navLink: 'text-sm hover:text-primary transition-colors',
  navLinkMobile: 'text-sm hover:text-primary hover:bg-muted/50 transition-all text-left py-3 px-3 rounded-lg',
  
  // Footer
  footerDescription: 'text-sm text-muted-foreground cursor-default',
  footerLink: 'text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer',
  footerTitle: 'text-sm font-semibold text-foreground cursor-default',
  footerCopyright: 'text-sm text-muted-foreground cursor-default',
  
  // Info Text (pagination, legends, etc.)
  infoText: 'text-sm text-muted-foreground cursor-default',
  
  // Profile Page
  profileName: 'text-2xl font-semibold cursor-default',
  profileUsername: 'text-muted-foreground text-sm cursor-default',
  profileBio: 'text-muted-foreground cursor-default',
  profileStatValue: 'text-2xl font-bold cursor-default',
  profileStatValueLarge: 'text-xl font-bold cursor-default',
  profileStatLabel: 'text-sm text-muted-foreground cursor-default',
  
  // Settings Page
  settingsPageTitle: 'text-3xl font-bold cursor-default flex items-center gap-2 mb-2',
  settingsPageDescription: 'text-base text-muted-foreground cursor-default',
  settingsOptionDescription: 'text-sm text-muted-foreground cursor-default',
  
  // Legal Pages (Terms, Privacy, Cookies)
  legalPageTitle: 'text-3xl font-bold cursor-default flex items-center gap-2 mb-2',
  legalPageDescription: 'text-base text-muted-foreground cursor-default mb-8',
  legalSectionTitle: 'text-xl font-semibold cursor-default mb-3',
  legalParagraph: 'text-base text-muted-foreground cursor-default',
  
  // Support Pages (Help Center, Contact Us, FAQs)
  supportPageTitle: 'text-3xl font-bold cursor-default flex items-center gap-2 mb-2',
  supportPageDescription: 'text-base text-muted-foreground cursor-default mb-8',
  supportCardText: 'text-sm cursor-default',
  supportContactTitle: 'text-lg font-semibold cursor-default mb-1',
  supportContactText: 'text-sm text-muted-foreground cursor-default',
  
  // Tournament Cards
  tournamentCardTitle: 'text-white text-2xl line-clamp-2 font-bold cursor-default',
  tournamentCardInfo: 'text-sm text-white cursor-default',
  tournamentCardBadge: 'text-xs uppercase tracking-wider cursor-default',
  tournamentCalendarCardTitle: 'font-bold text-sm leading-tight truncate cursor-default',
  tournamentCalendarCardInfo: 'text-sm font-medium cursor-default',

  // Tournament Detail Page
  tournamentDetailDescription: 'text-xl text-muted-foreground cursor-default',
  tournamentDetailDescriptionStyle: {
    fontSize: '1.25rem', // text-xl (20px)
    lineHeight: '32.5px', // 32.5px (1.625 от 20px)
    fontWeight: 400,
    cursor: 'default',
  },
  tournamentDetailLabel: 'uppercase text-muted-foreground cursor-default',
  tournamentDetailLabelStyle: {
    fontSize: '0.75rem', // text-xs (12px)
    letterSpacing: '0.25em', // tracking-[0.25em]
    fontWeight: 400,
    lineHeight: '18px', // 18px (1.5 от 12px)
    cursor: 'default',
  },
  tournamentDetailValue: 'cursor-default',
  tournamentDetailValueStyle: {
    fontSize: '1.125rem', // text-lg (18px)
    fontWeight: 400,
    lineHeight: '27px', // 27px (1.5 от 18px)
    cursor: 'default',
  },
  tournamentDetailSectionTitle: 'uppercase text-muted-foreground cursor-default',
  tournamentDetailSectionTitleStyle: {
    fontSize: '0.75rem', // text-xs (12px)
    letterSpacing: '0.25em', // tracking-[0.25em]
    fontWeight: 400,
    lineHeight: '18px', // 18px (1.5 от 12px)
    cursor: 'default',
  },
  tournamentDetailSubLabel: 'text-sm text-muted-foreground cursor-default',
  tournamentDetailSubLabelStyle: {
    fontSize: '0.875rem', // text-sm (14px)
    fontWeight: 400,
    lineHeight: '22.75px', // 22.75px (1.625 от 14px)
    cursor: 'default',
  },
  tournamentDetailSubValue: 'cursor-default',
  tournamentDetailSubValueStyle: {
    fontSize: '1.125rem', // text-lg (18px)
    fontWeight: 400,
    lineHeight: '27px', // 27px (1.5 от 18px)
    cursor: 'default',
  },
  tournamentDetailDescriptionText: 'text-sm text-muted-foreground cursor-default',
  tournamentDetailDescriptionTextStyle: {
    fontSize: '0.875rem', // text-sm (14px)
    lineHeight: '22.75px', // 22.75px (1.625 от 14px)
    fontWeight: 400,
    cursor: 'default',
  },
  tournamentDetailOrganizerName: 'cursor-pointer',
  tournamentDetailOrganizerNameStyle: {
    fontSize: '1.125rem', // text-lg (18px)
    fontWeight: 400,
    lineHeight: '27px', // 27px (1.5 от 18px)
    cursor: 'pointer',
  },
  tournamentDetailRulesList: 'text-sm text-muted-foreground cursor-default',
  tournamentDetailRulesListStyle: {
    fontSize: '0.875rem', // text-sm (14px)
    lineHeight: '22.75px', // 22.75px (1.625 от 14px)
    fontWeight: 400,
    cursor: 'default',
  },
} as const;

