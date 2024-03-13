/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */


package software.aws.solution.clickstream;

import lombok.extern.slf4j.*;
import org.apache.spark.sql.*;
import org.apache.spark.sql.expressions.*;
import org.apache.spark.sql.types.*;
import software.aws.solution.clickstream.model.*;
import static org.apache.spark.sql.functions.*;
import static software.aws.solution.clickstream.ETLRunner.*;

@Slf4j
public class IPEnrichmentV2 {
    public static final String IP_ENRICH_OUT = "ip_enrich_out";

    public Dataset<Row> transform(final Dataset<Row> dataset) {
        UserDefinedFunction udfEnrichIP = udf(IPEnrichment.enrich(), DataTypes.createStructType(
                new StructField[]{
                        DataTypes.createStructField("city", DataTypes.StringType, true),
                        DataTypes.createStructField("continent", DataTypes.StringType, true),
                        DataTypes.createStructField("country", DataTypes.StringType, true),

                        DataTypes.createStructField("metro", DataTypes.StringType, true),
                        DataTypes.createStructField("region", DataTypes.StringType, true),
                        DataTypes.createStructField("sub_continent", DataTypes.StringType, true),
                        DataTypes.createStructField("locale", DataTypes.StringType, true),
                }
        ));
        Dataset<Row> ipEnrichDataset = dataset.withColumn(IP_ENRICH_OUT,
                udfEnrichIP.apply(
                        split(col(ModelV2.IP), ",").getItem(0),
                        col(ModelV2.GEO_LOCALE)
                ))
                .withColumn(ModelV2.GEO_CITY, coalesce(col(IP_ENRICH_OUT).getField("city"), col(ModelV2.GEO_CITY)))
                .withColumn(ModelV2.GEO_CONTINENT, coalesce(col(IP_ENRICH_OUT).getField("continent"), col(ModelV2.GEO_CONTINENT)))
                .withColumn(ModelV2.GEO_COUNTRY, coalesce(col(IP_ENRICH_OUT).getField("country"), col(ModelV2.GEO_COUNTRY)))
                .withColumn(ModelV2.GEO_METRO, coalesce(col(IP_ENRICH_OUT).getField("metro"), col(ModelV2.GEO_METRO)))
                .withColumn(ModelV2.GEO_REGION, coalesce(col(IP_ENRICH_OUT).getField("region"), col(ModelV2.GEO_REGION)))
                .withColumn(ModelV2.GEO_SUB_CONTINENT, coalesce(col(IP_ENRICH_OUT).getField("sub_continent"), col(ModelV2.GEO_SUB_CONTINENT)))
                .drop(IP_ENRICH_OUT);

        if (ContextUtil.isDebugLocal()) {
            ipEnrichDataset.write().mode(SaveMode.Overwrite).json(DEBUG_LOCAL_PATH + "/enrich-ip-v2-Dataset/");
        }
        return ipEnrichDataset;
    }

}
