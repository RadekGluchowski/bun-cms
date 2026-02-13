const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeTime(date: string | Date | number): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();

    if (diff < 0) {
        return formatDateTime(dateObj);
    }

    if (diff < MINUTE) {
        return 'przed chwilą';
    }

    if (diff < HOUR) {
        const minutes = Math.floor(diff / MINUTE);
        if (minutes === 1) return '1 minutę temu';
        if (minutes < 5) return `${minutes} minuty temu`;
        return `${minutes} minut temu`;
    }

    if (diff < DAY) {
        const hours = Math.floor(diff / HOUR);
        if (hours === 1) return '1 godzinę temu';
        if (hours < 5) return `${hours} godziny temu`;
        return `${hours} godzin temu`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
        return 'wczoraj';
    }

    if (diff < WEEK) {
        const days = Math.floor(diff / DAY);
        if (days === 1) return '1 dzień temu';
        if (days < 5) return `${days} dni temu`;
        return `${days} dni temu`;
    }

    return formatDateTime(dateObj);
}

export function formatDateTime(date: string | Date | number): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatDate(date: string | Date | number): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}.${month}.${year}`;
}

export function formatTime(date: string | Date | number): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

export type DateGroup = 'Dzisiaj' | 'Wczoraj' | string;

export function getDateGroup(date: string | Date | number): DateGroup {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();

    const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.floor((todayOnly.getTime() - dateOnly.getTime()) / DAY);

    if (diffDays === 0) {
        return 'Dzisiaj';
    }
    if (diffDays === 1) {
        return 'Wczoraj';
    }

    return formatDate(dateObj);
}

export function groupByDateGroup<T>(
    items: T[],
    getDate: (item: T) => string | Date | number
): Map<DateGroup, T[]> {
    const groups = new Map<DateGroup, T[]>();

    const orderedGroups: DateGroup[] = [];

    for (const item of items) {
        const group = getDateGroup(getDate(item));

        if (!groups.has(group)) {
            groups.set(group, []);
            orderedGroups.push(group);
        }

        groups.get(group)!.push(item);
    }

    const orderedMap = new Map<DateGroup, T[]>();

    // Sort groups: Dzisiaj first, Wczoraj second, then dates descending
    const sortedGroups = orderedGroups.sort((a, b) => {
        if (a === 'Dzisiaj') return -1;
        if (b === 'Dzisiaj') return 1;
        if (a === 'Wczoraj') return -1;
        if (b === 'Wczoraj') return 1;

        // Parse dates and sort descending (newer first)
        // Format: DD.MM.YYYY
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);

        const [dayA = 1, monthA = 1, yearA = 2000] = partsA;
        const [dayB = 1, monthB = 1, yearB = 2000] = partsB;

        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);

        return dateB.getTime() - dateA.getTime();
    });

    for (const group of sortedGroups) {
        orderedMap.set(group, groups.get(group)!);
    }

    return orderedMap;
}
