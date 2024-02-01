const enum CacheControl {
  NO_CACHE = "private,max-age=0,no-cache,no-store",
  CACHE_60 = "no-transform,public,max-age=60,s-maxage=90",
  CACHE_300 = "no-transform,public,max-age=300,s-maxage=900",
  CACHE_WEEK = "no-transform,public,max-age=604800,s-maxage=1204800",
  CACHE_MONTH = "no-transform,public,max-age=2419200,s-maxage=2819200",
}

export { CacheControl };
