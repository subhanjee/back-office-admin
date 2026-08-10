export const safeNumber = (value: any) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const safeArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

export const normalizeAffiliateStats = (payload: any) => {
  const root = payload?.data ?? payload ?? {};
  const overview = root.overview ?? root;

  const totalClicks = safeNumber(
    overview.total ??
      overview.totalClicks ??
      overview.total_clicks ??
      overview.clicks ??
      overview.clicksCount ??
      0
  );

  const last7Days = safeNumber(
    overview.last7Days ??
      overview.last7_days ??
      overview.weekly ??
      overview.recent7Days ??
      overview.last_7_days ??
      0
  );

  const byOtaRaw =
    overview.byOta ??
    overview.otaBreakdown ??
    overview.otas ??
    root.byOta ??
    root.otaBreakdown ??
    root.otas ??
    [];

  const byCabinRaw =
    overview.byCabin ??
    overview.cabinBreakdown ??
    overview.cabins ??
    root.byCabin ??
    root.cabinBreakdown ??
    root.cabins ??
    [];

  const byDeviceRaw =
    overview.byDevice ??
    overview.deviceBreakdown ??
    overview.devices ??
    root.byDevice ??
    root.deviceBreakdown ??
    root.devices ??
    [];

  const recentRaw =
    overview.recent ??
    overview.recentClicks ??
    overview.clicks ??
    root.recent ??
    root.recentClicks ??
    [];

  const byOta = safeArray(byOtaRaw)
    .map((item: any) => ({
      name: item.otaName || item.name || item.ota || '',
      clicks: safeNumber(
        item.clicks ??
          item.count ??
          item.value ??
          item.total ??
          item._count?.id ??
          item._count?.total ??
          0
      ),
    }))
    .filter((item: any) => item.name && item.name.trim() !== '');

  const byCabin = safeArray(byCabinRaw)
    .map((item: any) => ({
      name: item.cabinType || item.type || item.name || '',
      value: safeNumber(
        item.clicks ??
          item.count ??
          item.value ??
          item.total ??
          item._count?.id ??
          item._count?.total ??
          0
      ),
    }))
    .filter((item: any) => item.name && item.name.trim() !== '');

  const byDevice = safeArray(byDeviceRaw)
    .map((item: any) => ({
      name: item.deviceType || item.type || item.name || '',
      value: safeNumber(
        item.clicks ??
          item.count ??
          item.value ??
          item.total ??
          item._count?.id ??
          item._count?.total ??
          0
      ),
    }))
    .filter((item: any) => item.name && item.name.trim() !== '');

  const recent = safeArray(recentRaw).map((item: any) => ({
    ...item,
    otaName: item.otaName || item.ota?.name || item.ota || item.name || '',
    cabinType: item.cabinType || item.cabin || item.type || '',
    deviceType: item.deviceType || item.device || '',
    priceAtClick:
      item.priceAtClick != null
        ? Number(item.priceAtClick)
        : item.priceShown != null
          ? Number(item.priceShown)
          : item.price != null
            ? Number(item.price)
            : null,
  }));

  return {
    overview: {
      totalClicks,
      last7Days,
      uniqueOtas: byOta.length,
      recentCount: recent.length,
      byOta,
      byCabin,
      byDevice,
      recent,
    },
    raw: root,
  };
};
