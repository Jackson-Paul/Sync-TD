<template>
    <b-card :header="title">
        <b-row class="td-card">
            <b-col
                md="2"
                v-for="(keyvalue, idx) in values"
                :key="idx"
            >
                <div>
                    <strong>{{ keyvalue.key }}:</strong>
                </div>
                <div>
                    <a v-if="keyvalue.link" :href="keyvalue.link" target="_blank" rel="noopener noreferrer">
                        {{ keyvalue.value }}
                    </a>
                    <span v-else>
                        {{ keyvalue.value }}
                    </span>
                </div>
            </b-col>
        </b-row>
    </b-card>
</template>

<style lang="scss" scoped>
.td-card {
    font-size: 14px;
}
</style>

<script>
export default {
    name: 'TdKeyValueCard',
    props: {
        title: String,
        values: Array
    }
};

</script>
