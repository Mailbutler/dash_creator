class CreateDashCreatorDashboardObjects < ActiveRecord::Migration[5.1]
  def self.up
    if extension_enabled?('pgcrypto')
      create_table :dash_creator_dashboard_objects, id: :uuid, default: 'gen_random_uuid()' do |t|
        t.string :name
        t.string :code

        t.jsonb :info, default: {model_name: ''}
        t.jsonb :options, default: {}

        t.timestamps
      end

    else
      create_table :dash_creator_dashboard_objects do |t|
        t.string :name
        t.string :code

        t.jsonb :info, default: {model_name: ''}
        t.jsonb :options, default: {}

        t.timestamps
      end
    end

    add_index :dash_creator_dashboard_objects, :code, unique: true
  end

  def self.down
    drop_table :dash_creator_dashboard_objects
  end
end
