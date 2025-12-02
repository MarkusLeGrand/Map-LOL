export function getButtonClasses(
    active: boolean,
    variant: string,
    fullWidth: boolean,
    additionalClasses: string
): string {
    let classes = 'px-3 py-2 rounded transition-colors ';

    if (fullWidth) {
        classes += 'w-full ';
    }

    if (active) {
        if (variant === 'blue') {
            classes += 'bg-blue-500 text-white ';
        } else if (variant === 'red') {
            classes += 'bg-red-500 text-white ';
        } else if (variant === 'purple') {
            classes += 'bg-purple-500 text-white ';
        } else if (variant === 'green') {
            classes += 'bg-green-500 text-white ';
        } else if (variant === 'yellow') {
            classes += 'bg-yellow-500 text-black ';
        } else if (variant === 'pink') {
            classes += 'bg-pink-500 text-white ';
        } else if (variant === 'orange') {
            classes += 'bg-orange-500 text-white ';
        } else if (variant === 'danger') {
            classes += 'bg-red-600 text-white hover:bg-red-700 ';
        } else {
            classes += 'bg-gray-600 text-white ';
        }
    } else {
        if (variant === 'danger') {
            classes += 'bg-red-600 hover:bg-red-700 text-white ';
        } else if (variant === 'purple') {
            classes += 'bg-purple-600 hover:bg-purple-700 text-white ';
        } else {
            classes += 'bg-gray-700 text-gray-300 hover:bg-gray-600 ';
        }
    }

    classes += additionalClasses;
    return classes;
}

export function getTowerLabelText(type: 'outer' | 'inner' | 'inhibitor' | 'nexus'): string {
    if (type === 'outer') {
        return 'T1';
    }
    if (type === 'inner') {
        return 'T2';
    }
    if (type === 'inhibitor') {
        return 'T3';
    }
    return 'T4';
}

export function getWardSize(wardType: 'vision' | 'control', visionWardSize: number, controlWardSize: number): number {
    if (wardType === 'vision') {
        return visionWardSize;
    }
    return controlWardSize;
}
